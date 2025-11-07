import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    console.log('Searching grants for query:', query);

    // Crawl official Polish grant websites - expanded sources
    const grantSources = [
      'https://www.gov.pl/web/fundusze-regiony',
      'https://www.funduszeeuropejskie.gov.pl/strony/o-funduszach/zasady-dzialania-funduszy/fundusze-europejskie-2021-2027',
      'https://www.funduszeeuropejskie.gov.pl/wyszukiwarka/mikro-male-i-srednie-przedsiebiorstwa/#/3756=Mikro,%20ma%C5%82e%20i%20%C5%9Brednie%20przedsi%C4%99biorstwa',
      'https://parp.gov.pl',
      'https://naszeauto.gov.pl/',
      'https://www.gov.pl/web/arimr/agencja-restrukturyzacji-i-modernizacji-rolnictwa',
      'https://serwis-uslugirozwojowe.parp.gov.pl/component/site/site/dofinansowania-bur/',
      'https://mapadotacji.gov.pl/',
      'https://www.gov.pl/web/gov/dotacje-i-dofinansowania',
      'https://www.gov.pl/web/kowr',
    ];

    const crawlPromises = grantSources.map(async (url) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to crawl ${url}:`, response.status);
          return null;
        }

        const data = await response.json();
        return {
          url,
          content: data.markdown || data.content || '',
        };
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        return null;
      }
    });

    const crawlResults = (await Promise.all(crawlPromises)).filter((r) => r !== null);
    console.log(`Crawled ${crawlResults.length} sources successfully`);

    // Combine all crawled content
    const combinedContent = crawlResults.map((r) => `Source: ${r.url}\n${r.content}`).join('\n\n---\n\n');

    // Use AI to extract and match grants from the crawled content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Jesteś asystentem specjalizującym się w analizie informacji o dotacjach i funduszach w Polsce. 
Twoim zadaniem jest wydobycie z podanych tekstów wszystkich dostępnych informacji o dotacjach, które pasują do zapytania użytkownika.
Zwróć wyniki w formacie JSON zawierającym tablicę obiektów z polami: title, description, amount, deadline, url, tags, category, maxAmount, eligibility.
- category: kategoryzuj jako "Mikro, małe i średnie przedsiębiorstwa", "Rolnictwo", "Transport i Ekologia", "NGO i organizacje", "Innowacje i B+R", lub "Rozwój regionalny"
- maxAmount: maksymalna kwota dofinansowania jeśli dostępna
- eligibility: krótki opis kto może aplikować
Jeśli nie ma wystarczających informacji, zwróć puste pole lub "Brak danych". URL powinien być linkiem do źródła informacji.`,
          },
          {
            role: 'user',
            content: `Zapytanie użytkownika: "${query}"\n\nPrzeanalizuj poniższe treści i wydobądź informacje o dotacjach pasujących do zapytania:\n\n${combinedContent.slice(0, 15000)}`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_grants',
              description: 'Zwraca listę dopasowanych dotacji z treści',
              parameters: {
                type: 'object',
                properties: {
                  grants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        amount: { type: 'string' },
                        deadline: { type: 'string' },
                        url: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        category: { type: 'string' },
                        maxAmount: { type: 'string' },
                        eligibility: { type: 'string' },
                      },
                      required: ['title', 'description', 'amount', 'deadline', 'url', 'tags'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['grants'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_grants' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let grants = [];
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        grants = parsed.grants || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      grants = [];
    }

    console.log(`Found ${grants.length} grants matching query`);

    return new Response(
      JSON.stringify({ grants }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in search-grants function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Wystąpił błąd podczas wyszukiwania dotacji'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

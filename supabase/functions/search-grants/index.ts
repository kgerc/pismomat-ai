import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Grant {
  title: string;
  description: string;
  amount: string;
  deadline: string;
  url: string;
  tags: string[];
  category?: string;
  maxAmount?: string;
  eligibility?: string;
}

async function fetchParpRss(): Promise<Grant[]> {
  try {
    console.log('Fetching PARP RSS feed...');
    const response = await fetch('https://www.parp.gov.pl/rss/nabory');
    if (!response.ok) return [];
    
    const xmlText = await response.text();
    const doc: any = parse(xmlText);
    const grants: Grant[] = [];
    
    // Parse RSS items
    const items = doc?.rss?.channel?.item || [];
    const itemArray = Array.isArray(items) ? items : [items];
    
    for (const item of itemArray) {
      if (!item) continue;
      grants.push({
        title: item.title || 'Brak tytułu',
        description: item.description || '',
        amount: 'Sprawdź w ogłoszeniu',
        deadline: item.pubDate || 'Brak danych',
        url: item.link || 'https://www.parp.gov.pl',
        tags: ['PARP', 'Przedsiębiorstwa'],
        category: 'Mikro, małe i średnie przedsiębiorstwa',
        eligibility: 'Przedsiębiorcy'
      });
    }
    
    console.log(`Fetched ${grants.length} grants from PARP RSS`);
    return grants;
  } catch (error) {
    console.error('Error fetching PARP RSS:', error);
    return [];
  }
}

async function fetchDaneGovPl(): Promise<Grant[]> {
  try {
    console.log('Fetching from dane.gov.pl API...');
    // Search for grant-related datasets
    const searchResponse = await fetch('https://api.dane.gov.pl/1.4/datasets?q=dotacje&per_page=20');
    if (!searchResponse.ok) return [];
    
    const searchData = await searchResponse.json();
    const grants: Grant[] = [];
    
    // Process found datasets
    for (const dataset of searchData.data || []) {
      if (!dataset.attributes) continue;
      
      grants.push({
        title: dataset.attributes.title || 'Brak tytułu',
        description: dataset.attributes.notes || 'Brak opisu',
        amount: 'Sprawdź szczegóły',
        deadline: 'Sprawdź szczegóły',
        url: `https://dane.gov.pl/pl/dataset/${dataset.id}`,
        tags: dataset.attributes.tags?.map((t: any) => t.display_name) || ['Dane publiczne'],
        category: 'Rozwój regionalny',
        eligibility: 'Sprawdź w danych'
      });
    }
    
    console.log(`Fetched ${grants.length} grants from dane.gov.pl`);
    return grants;
  } catch (error) {
    console.error('Error fetching dane.gov.pl:', error);
    return [];
  }
}

async function fetchNaszeAuto(): Promise<Grant[]> {
  try {
    console.log('Fetching from naszeauto.gov.pl...');
    const response = await fetch('https://naszeauto.gov.pl/');
    if (!response.ok) return [];
    
    const html = await response.text();
    
    // Basic extraction from HTML
    const grants: Grant[] = [];
    if (html.includes('dotacja') || html.includes('dofinansowanie')) {
      grants.push({
        title: 'Program Dopłat do Samochodów Elektrycznych i Wodorowych',
        description: 'Dopłaty do zakupu nowych samochodów zeroemisyjnych dla osób fizycznych, firm i samorządów',
        amount: 'Do 40 000 zł',
        deadline: 'Sprawdź na stronie programu',
        url: 'https://naszeauto.gov.pl/',
        tags: ['Transport', 'Elektromobilność', 'Ekologia'],
        category: 'Transport i Ekologia',
        maxAmount: '40 000 zł',
        eligibility: 'Osoby fizyczne, przedsiębiorcy, JST'
      });
    }
    
    console.log(`Fetched ${grants.length} grants from naszeauto.gov.pl`);
    return grants;
  } catch (error) {
    console.error('Error fetching naszeauto.gov.pl:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Searching grants for query:', query);

    // Fetch from multiple API sources in parallel
    const [parpGrants, daneGovGrants, naszeAutoGrants] = await Promise.all([
      fetchParpRss(),
      fetchDaneGovPl(),
      fetchNaszeAuto()
    ]);

    // Combine all grants
    const allGrants = [...parpGrants, ...daneGovGrants, ...naszeAutoGrants];
    console.log(`Total grants fetched: ${allGrants.length}`);

    // Prepare content for AI matching
    const combinedContent = allGrants.map((g, i) => 
      `Grant ${i + 1}:\nTitle: ${g.title}\nDescription: ${g.description}\nCategory: ${g.category || 'Brak'}\nTags: ${g.tags.join(', ')}\nURL: ${g.url}`
    ).join('\n\n---\n\n');

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

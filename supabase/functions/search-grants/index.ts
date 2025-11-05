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
    const HUGGING_FACE_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!HUGGING_FACE_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN is not configured');
    }

    console.log('Searching grants for query:', query);

    // Przykładowa baza dotacji (w produkcji można rozszerzyć o prawdziwe API lub bazę danych)
    const grantsDatabase = [
      {
        title: "Dotacja na rozpoczęcie działalności gospodarczej",
        description: "Wsparcie finansowe dla osób rozpoczynających własną działalność gospodarczą. Maksymalna kwota to 6-krotność przeciętnego wynagrodzenia.",
        amount: "do 40 000 PLN",
        deadline: "Nabór ciągły",
        url: "https://www.gov.pl/web/rodzina/dotacje-na-start",
        tags: ["biznes", "startup", "przedsiębiorczość"],
      },
      {
        title: "Dofinansowanie na modernizację gospodarstwa rolnego",
        description: "Program wsparcia dla rolników indywidualnych na rozwój i modernizację gospodarstw.",
        amount: "do 300 000 PLN",
        deadline: "31.12.2025",
        url: "https://www.arimr.gov.pl",
        tags: ["rolnictwo", "modernizacja", "ARiMR"],
      },
      {
        title: "Fundusze europejskie dla organizacji pozarządowych",
        description: "Wsparcie projektów społecznych realizowanych przez NGO. Priorytet: edukacja, kultura, integracja społeczna.",
        amount: "do 500 000 PLN",
        deadline: "30.06.2025",
        url: "https://www.funduszeeuropejskie.gov.pl",
        tags: ["NGO", "projekty społeczne", "UE"],
      },
      {
        title: "Dotacja na zakup sprzętu IT dla firm",
        description: "Program cyfryzacji przedsiębiorstw - dofinansowanie zakupu komputerów, oprogramowania i infrastruktury IT.",
        amount: "do 100 000 PLN",
        deadline: "15.09.2025",
        url: "https://www.gov.pl/web/cyfryzacja",
        tags: ["IT", "cyfryzacja", "technologia"],
      },
      {
        title: "Wsparcie dla innowacyjnych start-upów",
        description: "Program akceleracyjny dla innowacyjnych projektów technologicznych. Finansowanie, mentoring i networking.",
        amount: "do 1 000 000 PLN",
        deadline: "Nabór kwartalny",
        url: "https://parp.gov.pl",
        tags: ["innowacje", "technologia", "startup"],
      },
      {
        title: "Dotacja na odnawialne źródła energii",
        description: "Program 'Mój Prąd' - dofinansowanie zakupu i montażu instalacji fotowoltaicznych dla gospodarstw domowych.",
        amount: "do 7 000 PLN",
        deadline: "30.11.2025",
        url: "https://mojprad.gov.pl",
        tags: ["OZE", "fotowoltaika", "ekologia"],
      },
    ];

    // Proste filtrowanie - w produkcji można użyć AI do lepszego dopasowania
    const queryLower = query.toLowerCase();
    const matchedGrants = grantsDatabase.filter(grant => {
      const searchableText = `${grant.title} ${grant.description} ${grant.tags.join(' ')}`.toLowerCase();
      return searchableText.includes(queryLower) || 
             grant.tags.some(tag => queryLower.includes(tag.toLowerCase()));
    });

    // Jeśli brak bezpośrednich dopasowań, zwróć wszystkie
    const grants = matchedGrants.length > 0 ? matchedGrants : grantsDatabase.slice(0, 3);

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

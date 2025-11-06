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
    const { documentType, name, address, details } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating document for type:', documentType);

    // Mapowanie typów dokumentów na szczegółowe prompty
    const documentPrompts: Record<string, string> = {
      mandat: `Wygeneruj formalny wniosek o umorzenie mandatu karnego. Użyj poniższych danych:
Imię i nazwisko: ${name}
Adres: ${address}
Szczegóły: ${details || 'Brak dodatkowych szczegółów'}

Dokument powinien zawierać:
- Dane nadawcy i adresata
- Tytuł pisma
- Odniesienie do przepisów prawnych
- Uzasadnienie wniosku
- Formułę końcową z podpisem`,
      
      zus: `Wygeneruj formalną reklamację do ZUS. Użyj poniższych danych:
Imię i nazwisko: ${name}
Adres: ${address}
Szczegóły: ${details || 'Brak dodatkowych szczegółów'}

Dokument powinien zawierać:
- Dane nadawcy
- Dane ZUS jako adresata
- Tytuł reklamacji
- Opis problemu
- Żądanie rozpatrzenia sprawy
- Podstawę prawną
- Podpis`,
      
      gmina: `Wygeneruj formalne pismo do urzędu gminy. Użyj poniższych danych:
Imię i nazwisko: ${name}
Adres: ${address}
Szczegóły sprawy: ${details || 'Brak dodatkowych szczegółów'}

Dokument powinien zawierać:
- Dane nadawcy
- Urząd Gminy jako adresat
- Tytuł pisma
- Treść wniosku/zapytania
- Formułę grzecznościową
- Podpis`,

      podatki: `Wygeneruj wniosek o odroczenie terminu płatności podatku. Użyj danych:
Imię i nazwisko: ${name}
Adres: ${address}
Uzasadnienie: ${details || 'Trudna sytuacja finansowa'}

Dokument powinien zawierać wszystkie elementy formalnego wniosku administracyjnego.`,

      swiadczenie: `Wygeneruj wniosek o świadczenie rodzinne. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Szczegóły: ${details || 'Wniosek o przyznanie świadczenia'}

Dołącz wszystkie wymagane elementy formalne.`,

      dowod: `Wygeneruj wniosek o wydanie dowodu osobistego. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Powód wymiany: ${details || 'Utrata dokumentu'}`,

      ewidencja: `Wygeneruj wniosek o wpis do ewidencji działalności gospodarczej. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Rodzaj działalności: ${details || 'Do uzupełnienia'}`,

      koncesja: `Wygeneruj wniosek o koncesję. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Rodzaj koncesji: ${details || 'Do uzupełnienia'}`,

      odwolanie: `Wygeneruj odwołanie od decyzji administracyjnej. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Szczegóły decyzji: ${details || 'Sygnatura sprawy i data decyzji'}

Uwzględnij podstawę prawną, zarzuty i wniosek o uchylenie/zmianę decyzji.`,

      skarga: `Wygeneruj skargę do organu administracji publicznej. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Przedmiot skargi: ${details || 'Opis naruszenia/zaniedbania'}

Zachowaj formalny ton, podstawy prawne i wniosek końcowy.`,

      informacja_publiczna: `Wygeneruj wniosek o dostęp do informacji publicznej. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Zakres informacji: ${details || 'Dokładny opis żądanej informacji'}

Zawrzyj podstawy z ustawy o dostępie do informacji publicznej.`,

      reklamacja_uslugi: `Wygeneruj reklamację usługi. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Opis nieprawidłowości: ${details || 'Opis wady/usługi niewykonanej'}

Uwzględnij roszczenie: naprawa, wymiana, obniżenie ceny lub odstąpienie.`,

      wniosek_500plus: `Wygeneruj wniosek o świadczenie 500+. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Dzieci: ${details || 'Imiona, PESEL i daty urodzenia dzieci'}

Zachowaj aktualne wymogi formalne.`,

      umorzenie_odsetek: `Wygeneruj wniosek o umorzenie odsetek od zaległości. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Uzasadnienie: ${details || 'Szczegółowe uzasadnienie trudnej sytuacji'}

Powołaj się na ważny interes podatnika i interes publiczny.`,

      odroczenie_kary: `Wygeneruj wniosek o odroczenie wykonania kary. Dane:
Imię i nazwisko: ${name}
Adres: ${address}
Uzasadnienie: ${details || 'Szczegóły dotyczące sytuacji życiowej/zdrowotnej'}`,
    };

    const prompt = documentPrompts[documentType] || documentPrompts.gmina;

    // Wywołanie Lovable AI z modelem Gemini dla polskiego języka
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Jesteś ekspertem w tworzeniu formalnych pism urzędowych w Polsce. Generuj profesjonalne, zgodne z przepisami dokumenty w języku polskim."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Document generated successfully');

    const generatedText = result.choices?.[0]?.message?.content || prompt;

    // Dodanie daty i miejsca
    const today = new Date().toLocaleDateString('pl-PL');
    const city = address.split(',').pop()?.trim() || 'Warszawa';
    
    const finalDocument = `${city}, ${today}

${generatedText}

Z poważaniem,
${name}`;

    return new Response(
      JSON.stringify({ text: finalDocument }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-document function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Wystąpił błąd podczas generowania dokumentu'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

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
    const HUGGING_FACE_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!HUGGING_FACE_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN is not configured');
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

    // Wywołanie Hugging Face API z modelem dla polskiego języka
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/sdadas/polish-gpt2-large",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Document generated successfully');

    let generatedText = "";
    if (Array.isArray(result) && result[0]?.generated_text) {
      generatedText = result[0].generated_text;
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else {
      generatedText = prompt; // Fallback do promptu jeśli model nie zwróci odpowiedzi
    }

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

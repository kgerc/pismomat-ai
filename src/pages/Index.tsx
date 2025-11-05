import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Search, CheckCircle2, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Technologia AI</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Generator Wniosków<br />i Pism Urzędowych
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Generuj profesjonalne pisma urzędowe w kilka sekund. 
            Oszczędź czas i uniknij błędów formalnych dzięki sztucznej inteligencji.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Button size="lg" asChild>
              <Link to="/generator">
                <FileText />
                Rozpocznij teraz
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dotacje">
                <Search />
                Znajdź dotacje
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center shadow-md">
              <div className="mb-4 mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">20+ Szablonów</h3>
              <p className="text-muted-foreground">
                Szeroki wybór typów pism: wnioski, reklamacje, odwołania i więcej
              </p>
            </Card>

            <Card className="p-6 text-center shadow-md">
              <div className="mb-4 mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Generator</h3>
              <p className="text-muted-foreground">
                Nowoczesna technologia AI dostosowana do polskiego języka urzędowego
              </p>
            </Card>

            <Card className="p-6 text-center shadow-md">
              <div className="mb-4 mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Wyszukiwarka Dotacji</h3>
              <p className="text-muted-foreground">
                Znajdź dostępne dotacje i dowiedz się jak złożyć odpowiedni wniosek
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Jak to działa?</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Wybierz typ dokumentu", desc: "Wybierz spośród ponad 20 kategorii pism urzędowych" },
              { step: "2", title: "Wypełnij dane", desc: "Podaj swoje dane i szczegóły sprawy" },
              { step: "3", title: "Generuj dokument", desc: "AI przygotuje profesjonalne pismo w kilka sekund" },
              { step: "4", title: "Pobierz i wyślij", desc: "Pobierz gotowy dokument i wyślij do urzędu" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6">Gotowy na rozpoczęcie?</h2>
          <p className="text-lg mb-8 opacity-90">
            Dołącz do tysięcy użytkowników, którzy oszczędzają czas dzięki naszemu generatorowi
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/generator">
              Wypróbuj za darmo
              <CheckCircle2 />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 AI Generator Pism Urzędowych. Wszystkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

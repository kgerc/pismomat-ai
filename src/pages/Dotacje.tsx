import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const Dotacje = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("wszystkie");
  const { toast } = useToast();

  const categories = [
    "wszystkie",
    "Mikro, małe i średnie przedsiębiorstwa",
    "Rolnictwo",
    "Transport i Ekologia",
    "NGO i organizacje",
    "Innowacje i B+R",
    "Rozwój regionalny"
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Wprowadź zapytanie",
        description: "Wpisz czego szukasz, np. 'dotacja na firmę' lub 'wsparcie dla rolników'",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-grants", {
        body: { query: searchQuery },
      });

      if (error) throw error;

      setGrants(data.grants || []);
      
      if (data.grants?.length === 0) {
        toast({
          title: "Brak wyników",
          description: "Nie znaleziono dotacji pasujących do Twojego zapytania",
        });
      } else {
        toast({
          title: "Sukces",
          description: `Znaleziono ${data.grants.length} dotacji`,
        });
      }
    } catch (error) {
      console.error("Error searching grants:", error);
      toast({
        title: "Błąd wyszukiwania",
        description: "Wystąpił problem podczas wyszukiwania dotacji. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const filteredGrants = selectedCategory === "wszystkie" 
    ? grants 
    : grants.filter(g => g.category === selectedCategory || g.tags.includes(selectedCategory));

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Znajdź Dotacje</h1>
          <p className="text-muted-foreground text-lg">
            Wyszukaj dostępne dotacje i dowiedz się jak złożyć wniosek
          </p>
          {grants.length > 0 && (
            <div className="mt-4">
              <Card className="inline-block px-6 py-3 bg-primary/10">
                <p className="text-2xl font-bold text-primary">
                  {filteredGrants.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Aktywnych dotacji
                </p>
              </Card>
            </div>
          )}
        </div>

        <Card className="p-6 mb-8 shadow-lg">
          <div className="flex gap-3 mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Wpisz czego szukasz, np. 'dotacja na start-up', 'wsparcie dla NGO'..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} size="lg">
              {isSearching ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search />
              )}
              Szukaj
            </Button>
          </div>
          {grants.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Kategorie:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {filteredGrants.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Wyświetlanie {filteredGrants.length} z {grants.length} {grants.length === 1 ? "dotacji" : "dotacji"}
            </h2>
            {filteredGrants.map((grant, index) => (
              <Card key={index} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{grant.title}</h3>
                    {grant.category && (
                      <Badge variant="secondary" className="mb-2">{grant.category}</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1">{grant.amount}</Badge>
                    {grant.maxAmount && (
                      <p className="text-xs text-muted-foreground mt-1">Max: {grant.maxAmount}</p>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{grant.description}</p>
                {grant.eligibility && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-1">Kto może aplikować:</p>
                    <p className="text-sm text-muted-foreground">{grant.eligibility}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {grant.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Termin: {grant.deadline}
                  </span>
                  <Button variant="default" asChild>
                    <a href={grant.url} target="_blank" rel="noopener noreferrer">
                      Szczegóły
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredGrants.length === 0 && grants.length > 0 && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="mx-auto mb-4 h-16 w-16 opacity-20" />
              <p className="text-lg">Brak dotacji w wybranej kategorii</p>
            </div>
          </Card>
        )}

        {grants.length === 0 && !isSearching && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="mx-auto mb-4 h-16 w-16 opacity-20" />
              <p className="text-lg mb-2">Rozpocznij wyszukiwanie, aby znaleźć dostępne dotacje</p>
              <p className="text-sm">Agregujemy dotacje z 10+ źródeł rządowych i unijnych</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dotacje;

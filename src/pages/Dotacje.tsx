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
}

const Dotacje = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Znajdź Dotacje</h1>
          <p className="text-muted-foreground text-lg">
            Wyszukaj dostępne dotacje i dowiedz się jak złożyć wniosek
          </p>
        </div>

        <Card className="p-6 mb-8 shadow-lg">
          <div className="flex gap-3">
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
        </Card>

        {grants.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Znaleziono {grants.length} {grants.length === 1 ? "dotację" : "dotacji"}
            </h2>
            {grants.map((grant, index) => (
              <Card key={index} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{grant.title}</h3>
                  <Badge variant="secondary">{grant.amount}</Badge>
                </div>
                <p className="text-muted-foreground mb-4">{grant.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {grant.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Termin: {grant.deadline}
                  </span>
                  <Button variant="accent" asChild>
                    <a href={grant.url} target="_blank" rel="noopener noreferrer">
                      Szczegóły
                      <ExternalLink />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {grants.length === 0 && !isSearching && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="mx-auto mb-4 h-16 w-16 opacity-20" />
              <p className="text-lg">Rozpocznij wyszukiwanie, aby znaleźć dostępne dotacje</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dotacje;

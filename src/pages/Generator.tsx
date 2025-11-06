import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const documentTypes = [
  { value: "mandat", label: "Wniosek o umorzenie mandatu" },
  { value: "zus", label: "Reklamacja do ZUS" },
  { value: "gmina", label: "Pismo do urzędu gminy" },
  { value: "podatki", label: "Wniosek o odroczenie płatności podatku" },
  { value: "swiadczenie", label: "Wniosek o świadczenie rodzinne" },
  { value: "dowod", label: "Wniosek o wydanie dowodu osobistego" },
  { value: "ewidencja", label: "Wniosek o wpis do ewidencji działalności" },
  { value: "koncesja", label: "Wniosek o koncesję" },
  { value: "odwolanie", label: "Odwołanie od decyzji administracyjnej" },
  { value: "skarga", label: "Skarga do organu administracji" },
  { value: "informacja_publiczna", label: "Wniosek o informację publiczną" },
  { value: "reklamacja_uslugi", label: "Reklamacja usługi" },
  { value: "wniosek_500plus", label: "Wniosek o świadczenie 500+" },
  { value: "umorzenie_odsetek", label: "Wniosek o umorzenie odsetek" },
  { value: "odroczenie_kary", label: "Wniosek o odroczenie wykonania kary" },
];

const Generator = () => {
  const [documentType, setDocumentType] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!documentType || !name || !address) {
      toast({
        title: "Uzupełnij dane",
        description: "Wypełnij wszystkie wymagane pola",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-document", {
        body: {
          documentType,
          name,
          address,
          details,
        },
      });

      if (error) throw error;

      setGeneratedText(data.text);
      toast({
        title: "Dokument wygenerowany",
        description: "Twój dokument został pomyślnie wygenerowany",
      });
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Błąd generowania",
        description: "Wystąpił problem podczas generowania dokumentu. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - 2 * margin;
    
    const lines = doc.splitTextToSize(generatedText, maxLineWidth);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(lines, margin, 20);
    
    doc.save(`dokument-${documentType}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Generator Pism Urzędowych</h1>
          <p className="text-muted-foreground text-lg">
            Wygeneruj profesjonalne pismo w kilka sekund dzięki AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 shadow-lg">
            <div className="space-y-6">
              <div>
                <Label htmlFor="documentType">Typ dokumentu *</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="documentType" className="mt-2">
                    <SelectValue placeholder="Wybierz typ dokumentu" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Imię i nazwisko *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Kowalski"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">Adres *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ul. Przykładowa 123, 00-000 Warszawa"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="details">Szczegóły sprawy</Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Opisz szczegóły swojej sprawy..."
                  className="mt-2 min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <FileText />
                    Generuj dokument
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Wygenerowany dokument</h3>
              {generatedText && (
                <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                  <Download />
                  Pobierz PDF
                </Button>
              )}
            </div>
            <div className="bg-muted rounded-lg p-6 min-h-[500px]">
              {generatedText ? (
                <pre className="whitespace-pre-wrap text-sm font-mono">{generatedText}</pre>
              ) : (
                <p className="text-muted-foreground text-center mt-20">
                  Wypełnij formularz i wygeneruj dokument
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Generator;

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Copy, Calculator, Settings } from "lucide-react";

interface FuzzyNumber {
  a: number;
  m: number;
  b: number;
}

interface Product {
  name: string;
  demand: FuzzyNumber;
  price: FuzzyNumber;
  resourceUsage: number[];
}

interface Resource {
  name: string;
  capacity: number | FuzzyNumber;
}

const Index = () => {
  const [numProducts, setNumProducts] = useState(4);
  const [numResources, setNumResources] = useState(3);
  const [alpha, setAlpha] = useState([0.5]);
  const [generatedModel, setGeneratedModel] = useState('');

  const [products, setProducts] = useState<Product[]>([
    {
      name: "Produs A",
      demand: { a: 100, m: 150, b: 200 },
      price: { a: 30, m: 35, b: 40 },
      resourceUsage: [5, 7, 4, 0]
    },
    {
      name: "Produs B",
      demand: { a: 80, m: 120, b: 160 },
      price: { a: 25, m: 30, b: 34 },
      resourceUsage: [6, 5, 5, 0]
    },
    {
      name: "Produs C",
      demand: { a: 90, m: 130, b: 170 },
      price: { a: 28, m: 32, b: 38 },
      resourceUsage: [4, 6, 3, 0]
    },
    {
      name: "Produs D",
      demand: { a: 60, m: 100, b: 140 },
      price: { a: 20, m: 24, b: 28 },
      resourceUsage: [3, 4, 2, 0]
    },
    {
      name: "Produs E",
      demand: { a: 70, m: 110, b: 150 },
      price: { a: 22, m: 26, b: 30 },
      resourceUsage: [4, 5, 3, 2]
    }
  ]);

  const [resources, setResources] = useState<Resource[]>([
    { name: "Resursă 1", capacity: 1200 },
    { name: "Resursă 2", capacity: 1500 },
    { name: "Resursă 3", capacity: 1000 },
    { name: "Resursă 4", capacity: 800 }
  ]);

  // Ensure we have enough resource slots when numResources changes
  useEffect(() => {
    const newProducts = [...products];
    newProducts.forEach(product => {
      while (product.resourceUsage.length < numResources) {
        product.resourceUsage.push(0);
      }
    });
    setProducts(newProducts);
  }, [numResources]);

  const calculateAlphaCut = (fuzzy: FuzzyNumber, alphaValue: number): [number, number] => {
    const lower = fuzzy.a + alphaValue * (fuzzy.m - fuzzy.a);
    const upper = fuzzy.b + alphaValue * (fuzzy.m - fuzzy.b);
    return [lower, upper];
  };

  const getCrispValue = (fuzzy: FuzzyNumber, alphaValue: number): number => {
    const [lower, upper] = calculateAlphaCut(fuzzy, alphaValue);
    return (lower + upper) / 2;
  };

  const generateQMModel = () => {
    const alphaValue = alpha[0];
    let model = `Model de Programare Liniară – Optimizarea Producției\n`;
    model += `Nivel α = ${alphaValue.toFixed(2)}\n\n`;
    
    // Objective function
    model += `MAXIMIZE\n`;
    const objectiveTerms = products.slice(0, numProducts).map((product, i) => {
      const crispPrice = getCrispValue(product.price, alphaValue);
      return `${crispPrice.toFixed(2)} X${i + 1}`;
    });
    model += `${objectiveTerms.join(' + ')}\n\n`;

    // Resource constraints
    model += `SUBJECT TO\n`;
    resources.slice(0, numResources).forEach((resource, resIndex) => {
      const constraintTerms = products.slice(0, numProducts).map((product, prodIndex) => {
        const usage = product.resourceUsage[resIndex] || 0;
        return usage > 0 ? `${usage} X${prodIndex + 1}` : null;
      }).filter(term => term !== null);
      
      if (constraintTerms.length > 0) {
        const capacity = typeof resource.capacity === 'number' 
          ? resource.capacity 
          : getCrispValue(resource.capacity, alphaValue);
        model += `${constraintTerms.join(' + ')} <= ${capacity}\n`;
      }
    });

    // Demand constraints
    products.slice(0, numProducts).forEach((product, i) => {
      const crispDemand = getCrispValue(product.demand, alphaValue);
      model += `X${i + 1} <= ${crispDemand.toFixed(0)}\n`;
    });

    // Bounds
    model += `\nBOUNDS\n`;
    products.slice(0, numProducts).forEach((_, i) => {
      model += `X${i + 1} >= 0\n`;
    });

    model += `\nEND\n\n`;
    
    // Variable definitions
    model += `Definiții variabile:\n`;
    products.slice(0, numProducts).forEach((product, i) => {
      model += `X${i + 1} = ${product.name}\n`;
    });

    model += `\nValori α-cut (α = ${alphaValue.toFixed(2)}):\n`;
    products.slice(0, numProducts).forEach((product, i) => {
      const crispDemand = getCrispValue(product.demand, alphaValue);
      const crispPrice = getCrispValue(product.price, alphaValue);
      model += `${product.name}: Cerere=${crispDemand.toFixed(0)}, Preț=${crispPrice.toFixed(2)}\n`;
    });

    setGeneratedModel(model);
    toast({
      title: "Model generat!",
      description: `Model QM creat cu α = ${alphaValue.toFixed(2)}`,
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedModel);
      toast({
        title: "Copiat!",
        description: "Model copiat în clipboard",
      });
    } catch (err) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut copia",
        variant: "destructive",
      });
    }
  };

  const updateProductValue = (productIndex: number, field: string, subfield: string, value: string) => {
    const newProducts = [...products];
    const numValue = parseFloat(value) || 0;
    
    if (field === 'demand' || field === 'price') {
      newProducts[productIndex][field] = {
        ...newProducts[productIndex][field],
        [subfield]: numValue
      };
    } else if (field === 'resourceUsage') {
      const resourceIndex = parseInt(subfield);
      newProducts[productIndex].resourceUsage[resourceIndex] = numValue;
    } else if (field === 'name') {
      newProducts[productIndex].name = value;
    }
    
    setProducts(newProducts);
  };

  const updateResourceName = (resourceIndex: number, name: string) => {
    const newResources = [...resources];
    newResources[resourceIndex].name = name;
    setResources(newResources);
  };

  const updateResourceCapacity = (resourceIndex: number, value: string) => {
    const newResources = [...resources];
    newResources[resourceIndex].capacity = parseFloat(value) || 0;
    setResources(newResources);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Optimizarea Producției cu Numere Fuzzy
          </h1>
          <p className="text-lg text-gray-600">
            Programare liniară fuzzy - metoda α-cut
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Produse (3-5)</Label>
                <Input
                  type="number"
                  min="3"
                  max="5"
                  value={numProducts}
                  onChange={(e) => setNumProducts(parseInt(e.target.value) || 3)}
                />
              </div>
              <div>
                <Label>Resurse (2-4)</Label>
                <Input
                  type="number"
                  min="2"
                  max="4"
                  value={numResources}
                  onChange={(e) => setNumResources(parseInt(e.target.value) || 2)}
                />
              </div>
              <div>
                <Label>Nivel α: {alpha[0].toFixed(2)}</Label>
                <Slider
                  value={alpha}
                  onValueChange={setAlpha}
                  max={1}
                  min={0}
                  step={0.01}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resurse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.slice(0, numResources).map((resource, resourceIndex) => (
                <div key={resourceIndex} className="flex gap-2">
                  <div className="flex-1">
                    <Label>Nume resursă</Label>
                    <Input
                      value={resource.name}
                      onChange={(e) => updateResourceName(resourceIndex, e.target.value)}
                      placeholder="Nume resursă"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Capacitate</Label>
                    <Input
                      type="number"
                      value={typeof resource.capacity === 'number' ? resource.capacity : resource.capacity.m}
                      onChange={(e) => updateResourceCapacity(resourceIndex, e.target.value)}
                      placeholder="Capacitate"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, numProducts).map((product, productIndex) => (
                <div key={productIndex} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Nume</Label>
                      <Input
                        value={product.name}
                        onChange={(e) => updateProductValue(productIndex, 'name', '', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Cerere (a, m, b)</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={product.demand.a}
                          onChange={(e) => updateProductValue(productIndex, 'demand', 'a', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          value={product.demand.m}
                          onChange={(e) => updateProductValue(productIndex, 'demand', 'm', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          value={product.demand.b}
                          onChange={(e) => updateProductValue(productIndex, 'demand', 'b', e.target.value)}
                          className="w-20"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Preț (a, m, b)</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={product.price.a}
                          onChange={(e) => updateProductValue(productIndex, 'price', 'a', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          value={product.price.m}
                          onChange={(e) => updateProductValue(productIndex, 'price', 'm', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          value={product.price.b}
                          onChange={(e) => updateProductValue(productIndex, 'price', 'b', e.target.value)}
                          className="w-20"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Consum resurse</Label>
                      <div className="flex gap-1">
                        {resources.slice(0, numResources).map((resource, resourceIndex) => (
                          <Input
                            key={resourceIndex}
                            type="number"
                            value={product.resourceUsage[resourceIndex] || 0}
                            onChange={(e) => updateProductValue(productIndex, 'resourceUsage', resourceIndex.toString(), e.target.value)}
                            className="w-16"
                            title={resource.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Model QM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateQMModel} className="w-full" size="lg">
              Generează Model
            </Button>
            
            {generatedModel && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Model QM:</Label>
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiază
                  </Button>
                </div>
                <Textarea
                  value={generatedModel}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-right text-sm text-gray-600 py-4">
          Realizat de Daia Cosmin și Cotinghiu Mihnea
        </div>
      </div>
    </div>
  );
};

export default Index;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Globe, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { mauritianVocabulary } from '@/data/mauritianCulturalContent';

const CulturalVocabulary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const origins = ['all', 'Creole', 'French', 'Hindi', 'Tamil', 'Chinese', 'English'];

  const filteredVocabulary = mauritianVocabulary.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.context.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrigin = selectedOrigin === 'all' || word.origin === selectedOrigin;
    return matchesSearch && matchesOrigin;
  });

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const getOriginColor = (origin: string) => {
    const colors: Record<string, string> = {
      'Creole': 'bg-purple-100 text-purple-800',
      'French': 'bg-blue-100 text-blue-800',
      'Hindi': 'bg-orange-100 text-orange-800',
      'Tamil': 'bg-green-100 text-green-800',
      'Chinese': 'bg-red-100 text-red-800',
      'English': 'bg-gray-100 text-gray-800'
    };
    return colors[origin] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-green-500" />
            Mauritian Cultural Vocabulary
          </CardTitle>
          <p className="text-gray-600">
            Learn words from different languages spoken in Mauritius and their cultural context.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search words, meanings, or context..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {origins.map(origin => (
                <Button
                  key={origin}
                  variant={selectedOrigin === origin ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedOrigin(origin)}
                  className={selectedOrigin === origin ? "" : "text-gray-600"}
                >
                  {origin === 'all' ? 'All Languages' : origin}
                </Button>
              ))}
            </div>
          </div>

          {/* Vocabulary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocabulary.map((word, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedWord(word);
                  setShowAnswer(false);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{word.word}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(word.word);
                      }}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className={getOriginColor(word.origin)}>
                      {word.origin}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {word.context}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {word.meaning}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVocabulary.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vocabulary words found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Word Detail Modal */}
      {selectedWord && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-green-500" />
                {selectedWord.word}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => speakWord(selectedWord.word)}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Pronounce
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Badge className={getOriginColor(selectedWord.origin)}>
                Origin: {selectedWord.origin}
              </Badge>
              <Badge variant="outline">
                Context: {selectedWord.context}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Meaning:</h4>
              <p className="text-gray-700">{selectedWord.meaning}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Example:</h4>
              <p className="text-gray-700 italic">"{selectedWord.example}"</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedWord(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => speakWord(selectedWord.example)}
                variant="outline"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Read Example
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cultural Context Info */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Globe className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold text-green-800 mb-2">About Mauritian Languages</h4>
              <p className="text-sm text-green-700 mb-3">
                Mauritius is a multicultural country where people speak multiple languages. 
                This vocabulary reflects the rich linguistic heritage of the island, 
                including words from Creole, French, Hindi, Tamil, Chinese, and English.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Creole - Local language</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>French - Colonial influence</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Hindi - Indian heritage</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Tamil - South Indian</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Chinese - Chinese community</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span>English - Official language</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CulturalVocabulary;

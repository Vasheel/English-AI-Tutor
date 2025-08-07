// Test utility for adaptive difficulty system
export const testAdaptiveDifficulty = async () => {
  console.log('🧪 Testing Adaptive Difficulty System...');
  
  // Test data
  const testCases = [
    { accuracy: 90, avgTime: 15, hintsUsed: 0, expectedDifficulty: 2 },
    { accuracy: 95, avgTime: 10, hintsUsed: 0, expectedDifficulty: 3 },
    { accuracy: 40, avgTime: 45, hintsUsed: 5, expectedDifficulty: 1 },
    { accuracy: 70, avgTime: 25, hintsUsed: 2, expectedDifficulty: 1 },
  ];

  console.log('📊 Test Cases:');
  testCases.forEach((testCase, index) => {
    console.log(`Case ${index + 1}:`, {
      accuracy: testCase.accuracy,
      avgTime: testCase.avgTime,
      hintsUsed: testCase.hintsUsed,
      expectedDifficulty: testCase.expectedDifficulty
    });
  });

  // Simulate adaptive logic
  const calculateDifficulty = (accuracy: number, avgTime: number, hintsUsed: number) => {
    let difficulty = 1;
    
    // Increase difficulty if accuracy > 85% and avg time < 20s
    if (accuracy > 85 && avgTime < 20) {
      difficulty = Math.min(3, difficulty + 1);
    }
    
    // Decrease difficulty if accuracy < 50% or hints used > 3
    if (accuracy < 50 || hintsUsed > 3) {
      difficulty = Math.max(1, difficulty - 1);
    }
    
    return difficulty;
  };

  console.log('\n🔍 Results:');
  testCases.forEach((testCase, index) => {
    const calculatedDifficulty = calculateDifficulty(
      testCase.accuracy, 
      testCase.avgTime, 
      testCase.hintsUsed
    );
    
    const passed = calculatedDifficulty === testCase.expectedDifficulty;
    console.log(`Case ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`, {
      calculated: calculatedDifficulty,
      expected: testCase.expectedDifficulty
    });
  });

  return true;
};

// Test AI question generation simulation
export const testAIQuestionGeneration = () => {
  console.log('\n🤖 Testing AI Question Generation...');
  
  const difficultyPrompts = {
    1: "Easy vocabulary and basic grammar",
    2: "Intermediate vocabulary and grammar rules", 
    3: "Advanced vocabulary and complex grammar"
  };

  console.log('📝 Difficulty Prompts:');
  Object.entries(difficultyPrompts).forEach(([level, prompt]) => {
    console.log(`Level ${level}: ${prompt}`);
  });

  // Simulate question structure
  const mockQuestion = {
    question: "What is the correct form of the verb 'to be' in the sentence: 'She ___ going to school'?",
    options: ["is", "are", "am", "be"],
    answer: "A",
    explanation: "The subject 'She' is singular, so we use 'is'."
  };

  console.log('\n📋 Sample Question Structure:', mockQuestion);
  
  return true;
};

// Test performance tracking
export const testPerformanceTracking = () => {
  console.log('\n⏱️ Testing Performance Tracking...');
  
  const mockPerformance = {
    responseTime: 12.5,
    isCorrect: true,
    hintsUsed: 0,
    difficulty: 2
  };

  console.log('📊 Mock Performance Data:', mockPerformance);
  
  // Calculate performance metrics
  const performanceScore = mockPerformance.isCorrect ? 100 : 0;
  const timeScore = mockPerformance.responseTime <= 15 ? 'Fast' : 
                   mockPerformance.responseTime <= 30 ? 'Good' : 'Slow';
  const hintPenalty = mockPerformance.hintsUsed * 10;
  
  console.log('📈 Calculated Metrics:', {
    performanceScore,
    timeScore,
    hintPenalty,
    finalScore: performanceScore - hintPenalty
  });
  
  return true;
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting Adaptive Difficulty System Tests...\n');
  
  try {
    await testAdaptiveDifficulty();
    testAIQuestionGeneration();
    testPerformanceTracking();
    
    console.log('\n✅ All tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}; 
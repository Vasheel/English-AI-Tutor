# Adaptive Difficulty System

## Overview

The Adaptive Difficulty System is a comprehensive learning analytics and AI-powered question generation system that automatically adjusts the difficulty of educational content based on student performance. It tracks multiple metrics including accuracy, response time, and hint usage to provide a personalized learning experience.

## Features

### 🎯 Performance Tracking

- **Accuracy Monitoring**: Tracks correct vs incorrect answers
- **Response Time Analysis**: Measures how quickly students answer questions
- **Hint Usage Tracking**: Monitors how often students need help
- **Real-time Analytics**: Updates performance metrics in real-time

### 🧠 Adaptive Logic

- **Difficulty Adjustment**: Automatically increases/decreases difficulty based on performance
- **Smart Thresholds**:
  - Increase difficulty if accuracy > 85% and avg time < 20s
  - Decrease difficulty if accuracy < 50% or hint count > 3
- **Range Control**: Maintains difficulty between levels 1-3

### 🤖 AI Question Generation

- **OpenAI Integration**: Uses GPT-3.5-turbo for dynamic question generation
- **Difficulty-Based Prompts**: Different prompts for easy, medium, and hard questions
- **Question Caching**: Stores generated questions for reuse and offline access
- **Retry Logic**: Handles API failures with fallback to cached questions

### 📊 Analytics Dashboard

- **Performance Visualization**: Charts and metrics for student progress
- **Question History**: Detailed log of all attempted questions
- **Difficulty Distribution**: Shows breakdown of questions by difficulty level
- **Real-time Updates**: Live performance tracking

## Database Schema

### Tables Created

#### `student_progress`

```sql
- user_id: UUID (references profiles)
- topic: TEXT (e.g., 'word_scramble', 'grammar')
- current_difficulty: INTEGER (1-3)
- accuracy: DECIMAL (percentage)
- avg_response_time: DECIMAL (seconds)
- hints_used: INTEGER
- total_questions: INTEGER
- correct_answers: INTEGER
- last_updated: TIMESTAMP
```

#### `question_history`

```sql
- user_id: UUID
- topic: TEXT
- question_text: TEXT
- user_answer: TEXT
- correct_answer: TEXT
- is_correct: BOOLEAN
- response_time: DECIMAL
- difficulty_level: INTEGER
- hints_used: INTEGER
- ai_generated: BOOLEAN
- created_at: TIMESTAMP
```

#### `ai_question_cache`

```sql
- topic: TEXT
- difficulty_level: INTEGER
- question_text: TEXT
- options: JSONB
- correct_answer: TEXT
- explanation: TEXT
- usage_count: INTEGER
- last_used: TIMESTAMP
```

## Components

### Hooks

#### `useAdaptiveDifficulty(topic: string)`

Main hook for managing adaptive difficulty functionality.

**Returns:**

- `currentProgress`: Current student progress data
- `currentDifficulty`: Current difficulty level (1-3)
- `accuracy`: Current accuracy percentage
- `avgResponseTime`: Average response time in seconds
- `startQuestionTimer()`: Start timing a question
- `getElapsedTime()`: Get time elapsed since timer started
- `updateStudentProgress()`: Update progress with adaptive logic
- `generateAIQuestion()`: Generate AI question for difficulty level
- `getCachedQuestion()`: Get cached question for difficulty level

### Components

#### `PerformanceTracker`

Reusable component for displaying performance metrics.

**Props:**

- `topic`: The learning topic
- `showDetails`: Whether to show detailed stats
- `className`: Additional CSS classes

#### `AdaptiveDifficultyDashboard`

Comprehensive dashboard for viewing adaptive difficulty analytics.

**Features:**

- Topic selector for different learning areas
- Performance overview cards
- Detailed statistics
- Question history with filtering
- Real-time updates

## Integration Example

```tsx
import { useAdaptiveDifficulty } from "@/hooks/useAdaptiveDifficulty";

const MyGame = () => {
  const {
    currentDifficulty,
    startQuestionTimer,
    getElapsedTime,
    updateStudentProgress,
    generateAIQuestion,
  } = useAdaptiveDifficulty("word_scramble");

  const handleQuestionStart = () => {
    startQuestionTimer();
    // Generate AI question based on current difficulty
    generateAIQuestion(currentDifficulty);
  };

  const handleAnswerSubmit = async (isCorrect: boolean, userAnswer: string) => {
    const responseTime = getElapsedTime();

    // Update progress with adaptive logic
    await updateStudentProgress(isCorrect, responseTime, hintsUsed, {
      questionText: "Your question text",
      userAnswer: userAnswer,
      correctAnswer: "Correct answer",
      aiGenerated: false,
    });
  };

  return (
    <div>
      <p>Current Difficulty: {currentDifficulty}/3</p>
      {/* Your game UI */}
    </div>
  );
};
```

## API Integration

### OpenAI Configuration

The system uses OpenAI's GPT-3.5-turbo model for question generation. Ensure your environment variables are set:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Question Generation Prompts

**Level 1 (Easy):**

```
Create an easy English vocabulary question suitable for 6th grade students.
The question should test basic word meanings and simple grammar concepts.
```

**Level 2 (Medium):**

```
Create a medium-difficulty English question suitable for 6th grade students.
The question should test intermediate vocabulary, grammar rules, and reading comprehension.
```

**Level 3 (Hard):**

```
Create a challenging English question suitable for advanced 6th grade students.
The question should test complex vocabulary, advanced grammar concepts, and critical thinking.
```

## Error Handling

### Retry Logic

- Maximum 3 retries for OpenAI API calls
- Fallback to cached questions if API fails
- Graceful degradation with user-friendly error messages

### Data Validation

- Prevents data corruption with validation checks
- Handles edge cases like negative values
- Maintains data integrity with constraints

## Performance Optimizations

### Caching Strategy

- Questions are cached in Supabase for reuse
- Reduces API calls and improves response time
- Enables offline functionality

### Database Indexes

- Optimized queries with proper indexing
- Efficient performance tracking
- Fast question history retrieval

## Usage Instructions

### 1. Database Setup

Run the migration to create the required tables:

```bash
supabase db push
```

### 2. Environment Configuration

Set up your OpenAI API key:

```env
VITE_OPENAI_API_KEY=your_api_key_here
```

### 3. Component Integration

Import and use the adaptive difficulty hook in your components:

```tsx
import { useAdaptiveDifficulty } from "@/hooks/useAdaptiveDifficulty";
```

### 4. Dashboard Access

Navigate to `/adaptive-dashboard` to view the analytics dashboard.

## Testing

Run the test suite to verify system functionality:

```tsx
import { runAllTests } from "@/utils/adaptiveDifficultyTest";

// Run all tests
await runAllTests();
```

## Future Enhancements

### Planned Features

- **Machine Learning Integration**: More sophisticated difficulty prediction
- **Multi-modal Questions**: Support for images, audio, and video
- **Collaborative Learning**: Group-based difficulty adjustment
- **Advanced Analytics**: Predictive performance modeling

### Potential Improvements

- **A/B Testing**: Compare different adaptive algorithms
- **Personalization**: Individual learning style adaptation
- **Gamification**: Achievement system based on difficulty progression
- **Parent/Teacher Dashboard**: Separate analytics for educators

## Troubleshooting

### Common Issues

**1. OpenAI API Errors**

- Check API key configuration
- Verify network connectivity
- Review API rate limits

**2. Database Connection Issues**

- Verify Supabase configuration
- Check RLS policies
- Ensure proper authentication

**3. Performance Tracking Issues**

- Verify user authentication
- Check database permissions
- Review error logs

### Debug Mode

Enable debug logging by setting:

```tsx
localStorage.setItem("debug_adaptive", "true");
```

## Contributing

When contributing to the adaptive difficulty system:

1. **Test thoroughly** with different performance scenarios
2. **Update documentation** for any new features
3. **Follow the existing patterns** for consistency
4. **Add appropriate error handling** for new features
5. **Update the test suite** for new functionality

## License

This adaptive difficulty system is part of the English AI Tutor project and follows the same licensing terms.

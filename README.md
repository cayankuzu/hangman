# Hangman

Hangman combines sourced knowledge questions with a cinematic 3D hangman stage.
The bilingual web game offers three distinct modes:

- **Classic:** Complete the answer by selecting letters and numbers.
- **Execute:** Build the execution mechanism step by step with correct answers.
- **Rescue:** Untie the character with each correct answer.

Each of the six characters has a separate pool of 99 questions at three
difficulty levels. Every pool contains 33 factual questions and 66 clearly
labelled dark-satire variants about documented public actions and
contradictions.

## Local development

```bash
npm install
npm run dev
```

Game: [http://localhost:5173](http://localhost:5173)  
Avatar lab: [http://localhost:5173/avatar-lab](http://localhost:5173/avatar-lab)

## Validation

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

The 3D stage is lazy-loaded before interaction. Animation and gameplay sound
effects are generated with the Web Audio API; the game has no background music.

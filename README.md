# Hangman

Hangman combines sourced knowledge questions with a cinematic 3D hangman stage.
The bilingual web game offers three distinct modes:

**Live game:** [hangman.vercel.app](https://hangman.vercel.app)

- **Classic:** Complete the answer by selecting letters and numbers.
- **Execute:** Build the execution mechanism step by step with correct answers.
- **Rescue:** Untie the character with each correct answer.

Each of the six characters has their own pool of sourced questions at three
difficulty levels. A round serves every unique question of the chosen level
before borrowing from neighbouring levels, so questions never repeat early.

## Controls

| Key | Action |
| --- | --- |
| `A`–`D` or `1`–`4` | Answer |
| `J` | 50/50 joker (two on Easy, one on Medium and Hard) |
| `Enter` / `→` | Next question |

The HUD shows the six-step mechanism, the current streak and accuracy. At
step zero there is no margin: a wrong answer ends the round. The result
screen rates the round and keeps a best-streak record per character, mode
and difficulty.

## Local development

```bash
npm install
npm run dev
```

Game: [http://localhost:3030](http://localhost:3030)  
Avatar lab: [http://localhost:3030/avatar-lab](http://localhost:3030/avatar-lab)

## Validation

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

The 3D stage is lazy-loaded before interaction. Animation and gameplay sound
effects are generated with the Web Audio API; the game has no background music.

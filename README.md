# Daily Habit Tracker

A single-file React habit tracker with a dark UI, month grid, weekly report card, and year heatmap.

![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## Overview

`daily_habit_tracker_weekly.jsx` is a self-contained React component for tracking daily habits. It supports three views — **Month**, **Week**, and **Year** — so you can log habits day by day and review progress over time.

## Features

### Month view
- Daily check-off grid for each habit
- Streak counter per habit
- Row completion percentage
- Month-wide completion stats
- Add and remove habits
- Future dates are disabled

### Week view
- Weekly report card (most recent weeks first)
- Completion percentage with progress bar
- Trend vs previous week (up / down / flat)
- Perfect days count
- Weakest habit per week as a focus area
- Year selector (current year and past years)

### Year view
- GitHub-style activity heatmap
- Color intensity by daily completion rate
- Year average completion and days tracked
- Per-habit streak cards

## Default habits

The app ships with these starter habits (you can edit or remove them):

- Workout
- Study 4 hours
- DSA
- AI learning
- Project work
- GitHub commit
- Read documentation
- Drink 3L water
- Sleep 7+ hours
- Meditation
- No social media while studying

## Tech stack

| Dependency | Purpose |
|------------|---------|
| [React](https://react.dev/) | UI framework |
| [lucide-react](https://lucide.dev/) | Icons |
| Google Fonts | Space Grotesk, Inter, JetBrains Mono |

## Getting started

### Option 1: Drop into an existing React app

1. Copy `daily_habit_tracker_weekly.jsx` into your project (e.g. `src/components/`).
2. Install dependencies:
import HabitTracker from "./components/daily_habit_tracker_weekly";

function App() {
  return <HabitTracker />;
}

export default App;

```bash
npm install lucide-react

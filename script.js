const workoutPlan = {
  Monday: [
    { name: "Barbell Squat", reps: "4 x 12" },
    { name: "Bench Press", reps: "4 x 10" },
    { name: "Lat Pulldown", reps: "4 x 10" },
    { name: "Dumbbell Shoulder Press", reps: "3 x 12" },
    { name: "Plank", reps: "3 x 45 sec" },
    { name: "Treadmill Incline Walk", reps: "20 min (Incline 10, Speed 4.5)" }
  ],
  Tuesday: [
    { name: "Jump Rope", reps: "1 min x 5" },
    { name: "Burpees", reps: "10 x 5" },
    { name: "Mountain Climbers", reps: "30 sec x 5" },
    { name: "High Knees", reps: "30 sec x 5" },
    { name: "Leg Raises", reps: "3 x 15" },
    { name: "Russian Twist", reps: "3 x 20" },
    { name: "Cycling", reps: "15 min" }
  ],
  Wednesday: [
    { name: "Squats", reps: "4 x 12" },
    { name: "Lunges", reps: "3 x 12 each leg" },
    { name: "Leg Press", reps: "3 x 12" },
    { name: "Hamstring Curl", reps: "3 x 12" },
    { name: "Calf Raises", reps: "4 x 15" },
    { name: "Treadmill", reps: "20 min (Incline 8)" }
  ],
  Thursday: [
    { name: "Bench Press", reps: "4 x 10" },
    { name: "Lat Pulldown", reps: "4 x 10" },
    { name: "Seated Row", reps: "3 x 12" },
    { name: "Shoulder Press", reps: "3 x 12" },
    { name: "Bicep Curl", reps: "3 x 12" },
    { name: "Tricep Pushdown", reps: "3 x 12" },
    { name: "Incline Walk", reps: "20 min (Incline 10)" }
  ],
  Friday: [
    { name: "Deadlift", reps: "4 x 10" },
    { name: "Kettlebell Swings", reps: "3 x 15" },
    { name: "Step Ups", reps: "3 x 12" },
    { name: "Pushups", reps: "3 x 12" },
    { name: "Battle Rope", reps: "30 sec x 5" },
    { name: "Treadmill", reps: "20 min (Incline 7)" }
  ],
  Saturday: [
    { name: "Walk", reps: "6-7 km" },
    { name: "Treadmill", reps: "40 min (Incline 6)" },
    { name: "Cross Trainer", reps: "30 min" },
    { name: "Leg Raises", reps: "3 x 15" },
    { name: "Plank", reps: "3 x 1 min" }
  ],
  Sunday: [
    { name: "Rest Day", reps: "Recover, stretch, or take a light walk" }
  ]
};

const EXERCISE_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_PLANK_DURATION_MS = 60 * 1000;
const STORAGE_PREFIX = "workoutTracker";

const today = new Date().toLocaleString("en-US", { weekday: "long" });
const dateKey = getLocalDateKey(new Date());
let showAll = false;
let selectedDay = today;
let timerInterval;
let sessionInterval;
let exerciseIntervals = {};

const container = document.getElementById("exerciseContainer");
const dayTitle = document.getElementById("dayTitle");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const toggleViewBtn = document.getElementById("toggleViewBtn");
const restBtn = document.getElementById("restBtn");
const waterBtn = document.getElementById("waterBtn");
const resetBtn = document.getElementById("resetBtn");
const waterText = document.getElementById("water");
const streakText = document.getElementById("streak");
const sessionSummary = document.getElementById("sessionSummary");
const timerText = document.getElementById("timer");

toggleViewBtn.addEventListener("click", toggleView);
restBtn.addEventListener("click", startRestTimer);
waterBtn.addEventListener("click", addWater);
resetBtn.addEventListener("click", resetDay);

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function storageKey(...parts) {
  return [STORAGE_PREFIX, ...parts].join(":");
}

function exerciseKey(day, index) {
  return storageKey(dateKey, day, index);
}

function startKey(key) {
  return `${key}:startedAt`;
}

function durationKey(key) {
  return `${key}:duration`;
}

function targetKey(key) {
  return `${key}:target`;
}

function pausedAtKey(key) {
  return `${key}:pausedAt`;
}

function pausedTotalKey(key) {
  return `${key}:pausedTotal`;
}

function waterKey() {
  return storageKey(dateKey, "water");
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatExerciseTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clearExerciseIntervals() {
  Object.values(exerciseIntervals).forEach((interval) => clearInterval(interval));
  exerciseIntervals = {};
}

function getExerciseElapsed(key) {
  const startedAt = parseInt(localStorage.getItem(startKey(key)) || "0", 10);
  if (!startedAt) return 0;

  const pausedAt = parseInt(localStorage.getItem(pausedAtKey(key)) || "0", 10);
  const pausedTotal = parseInt(localStorage.getItem(pausedTotalKey(key)) || "0", 10);
  const endTime = pausedAt || Date.now();

  return Math.max(0, endTime - startedAt - pausedTotal);
}

function isPlankExercise(exercise) {
  return exercise.name.toLowerCase().includes("plank");
}

function getDefaultPlankDuration(exercise) {
  const reps = exercise.reps.toLowerCase();
  const minuteMatch = reps.match(/(\d+)\s*min/);
  const secondMatch = reps.match(/(\d+)\s*sec/);

  if (minuteMatch) return parseInt(minuteMatch[1], 10) * 60 * 1000;
  if (secondMatch) return parseInt(secondMatch[1], 10) * 1000;

  return DEFAULT_PLANK_DURATION_MS;
}

function getExerciseTargetDuration(key) {
  return parseInt(localStorage.getItem(targetKey(key)) || EXERCISE_DURATION_MS, 10);
}

function addWater() {
  const water = parseInt(localStorage.getItem(waterKey()) || "0", 10) + 1;
  localStorage.setItem(waterKey(), water);
  updateWaterUI();
}

function updateWaterUI() {
  const water = localStorage.getItem(waterKey()) || "0";
  waterText.textContent = `Water: ${water} glasses`;
}

function updateStreak() {
  const streak = parseInt(localStorage.getItem(storageKey("streak")) || "0", 10);
  streakText.textContent = `Streak: ${streak} days`;
}

function startRestTimer() {
  let time = 60;
  clearInterval(timerInterval);
  timerText.textContent = `Rest: ${time}s`;

  timerInterval = setInterval(() => {
    time -= 1;
    timerText.textContent = time > 0 ? `Rest: ${time}s` : "Ready for next set";

    if (time <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

function resetDay() {
  const targetDay = showAll ? today : selectedDay;
  const answer = confirm(`Reset ${targetDay}'s workout and water for today?`);
  if (!answer) return;

  Object.keys(localStorage)
    .filter((key) => key === waterKey() || key.startsWith(storageKey(dateKey, targetDay)))
    .forEach((key) => localStorage.removeItem(key));

  clearInterval(timerInterval);
  timerText.textContent = "";
  render();
}

function setLoad(key) {
  const current = localStorage.getItem(`${key}:load`) || "";
  const value = prompt("Enter load in kg:", current);
  if (value === null) return;

  const cleanValue = value.trim();
  if (cleanValue) {
    localStorage.setItem(`${key}:load`, cleanValue);
  } else {
    localStorage.removeItem(`${key}:load`);
  }

  render();
}

function setPlankDuration(key, input) {
  const seconds = parseInt(input.value || "0", 10);
  if (!seconds || seconds < 5) {
    alert("Set at least 5 seconds.");
    return;
  }

  localStorage.setItem(targetKey(key), String(seconds * 1000));
  render();
}

function startExercise(key) {
  if (localStorage.getItem(key) === "done") return;

  localStorage.setItem(startKey(key), String(Date.now()));
  localStorage.setItem(pausedTotalKey(key), "0");
  localStorage.removeItem(pausedAtKey(key));
  localStorage.removeItem(durationKey(key));

  render();
}

function pauseExercise(key) {
  if (localStorage.getItem(key) === "done") return;
  if (!localStorage.getItem(startKey(key))) return;
  if (localStorage.getItem(pausedAtKey(key))) return;

  localStorage.setItem(pausedAtKey(key), String(Date.now()));
  render();
}

function resumeExercise(key) {
  const pausedAt = parseInt(localStorage.getItem(pausedAtKey(key)) || "0", 10);
  if (!pausedAt) return;

  const pausedTotal = parseInt(localStorage.getItem(pausedTotalKey(key)) || "0", 10);
  localStorage.setItem(pausedTotalKey(key), String(pausedTotal + Date.now() - pausedAt));
  localStorage.removeItem(pausedAtKey(key));
  render();
}

function completeExercise(key) {
  const duration = getExerciseElapsed(key) || getExerciseTargetDuration(key);

  clearInterval(exerciseIntervals[key]);
  delete exerciseIntervals[key];

  localStorage.setItem(key, "done");
  localStorage.setItem(durationKey(key), String(duration));
  localStorage.removeItem(startKey(key));
  localStorage.removeItem(pausedAtKey(key));
  localStorage.removeItem(pausedTotalKey(key));

  render();
}

function resetExercise(key) {
  clearInterval(exerciseIntervals[key]);
  delete exerciseIntervals[key];

  localStorage.removeItem(key);
  localStorage.removeItem(startKey(key));
  localStorage.removeItem(durationKey(key));
  localStorage.removeItem(pausedAtKey(key));
  localStorage.removeItem(pausedTotalKey(key));

  render();
}

function updateExerciseTimer(card, key) {
  const startedAt = parseInt(localStorage.getItem(startKey(key)) || "0", 10);
  const pausedAt = parseInt(localStorage.getItem(pausedAtKey(key)) || "0", 10);
  const isDone = localStorage.getItem(key) === "done";
  const timer = card.querySelector(".exercise-time");
  const clockValue = card.querySelector(".plank-clock-value");
  const targetDuration = getExerciseTargetDuration(key);

  if (isDone) {
    const duration = parseInt(localStorage.getItem(durationKey(key)) || "0", 10);
    if (timer) timer.textContent = duration ? `Done in ${formatExerciseTime(duration)}` : "Completed";
    if (clockValue) clockValue.textContent = "Done";
    card.style.setProperty("--exercise-progress", "100%");
    card.style.setProperty("--plank-progress", "100%");
    return;
  }

  if (!startedAt) return;

  const elapsed = getExerciseElapsed(key);
  const percent = Math.min((elapsed / targetDuration) * 100, 100);
  const remaining = targetDuration - elapsed;

  card.classList.add("active");
  card.classList.toggle("paused", Boolean(pausedAt));
  card.style.setProperty("--exercise-progress", `${percent}%`);
  card.style.setProperty("--plank-progress", `${percent}%`);

  if (timer) {
    timer.textContent = pausedAt
      ? `Paused at ${formatExerciseTime(elapsed)}`
      : `${formatExerciseTime(remaining)} left`;
  }

  if (clockValue) {
    clockValue.textContent = formatExerciseTime(remaining);
  }

  if (elapsed >= targetDuration) {
    completeExercise(key);
  }
}

function updateSessionSummary() {
  const exercises = workoutPlan[selectedDay] || [];
  let totalDuration = 0;
  let completed = 0;

  exercises.forEach((_, index) => {
    const key = exerciseKey(selectedDay, index);
    const duration = parseInt(localStorage.getItem(durationKey(key)) || "0", 10);

    if (localStorage.getItem(key) === "done") {
      completed += 1;
      totalDuration += duration;
    } else if (localStorage.getItem(startKey(key))) {
      totalDuration += getExerciseElapsed(key);
    }
  });

  sessionSummary.textContent = `Training time: ${formatExerciseTime(totalDuration)} | ${completed} done`;
}

function updateProgress() {
  const exercises = workoutPlan[selectedDay] || [];
  const total = exercises.length;
  const done = exercises.filter((_, index) => localStorage.getItem(exerciseKey(selectedDay, index)) === "done").length;
  const percent = total ? (done / total) * 100 : 0;

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${done}/${total} completed`;

  if (done === total && total > 0 && selectedDay === today) {
    progressText.textContent += " - Done";
    updateCompletionStreak();
  }
}

function updateCompletionStreak() {
  const lastCompletedKey = storageKey("lastCompletedDate");
  const streakKey = storageKey("streak");
  const last = localStorage.getItem(lastCompletedKey);

  if (last === dateKey) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);
  const currentStreak = parseInt(localStorage.getItem(streakKey) || "0", 10);
  const nextStreak = last === yesterdayKey ? currentStreak + 1 : 1;

  localStorage.setItem(streakKey, String(nextStreak));
  localStorage.setItem(lastCompletedKey, dateKey);
  updateStreak();
}

function createButton(label, className, onClick, disabled = false) {
  const button = createElement("button", className, label);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function createCard(exercise, index, day) {
  const card = createElement("article", "card");
  card.style.animationDelay = `${Math.min(index * 45, 260)}ms`;

  const key = exerciseKey(day, index);
  const isPlank = isPlankExercise(exercise);
  if (isPlank && !localStorage.getItem(targetKey(key))) {
    localStorage.setItem(targetKey(key), String(getDefaultPlankDuration(exercise)));
  }

  const isDone = localStorage.getItem(key) === "done";
  const isActive = Boolean(localStorage.getItem(startKey(key)));
  const isPaused = Boolean(localStorage.getItem(pausedAtKey(key)));
  const load = localStorage.getItem(`${key}:load`);
  const targetDuration = getExerciseTargetDuration(key);

  card.classList.toggle("done", isDone);
  card.classList.toggle("active", isActive && !isDone);
  card.classList.toggle("paused", isPaused && !isDone);

  card.append(
    createElement("h3", "", exercise.name),
    createElement("p", "", exercise.reps)
  );

  if (isPlank) {
    card.append(createPlankControl(key, targetDuration, isActive, isDone));
  }

  const metaRow = createElement("div", "meta-row");
  metaRow.append(
    createElement("span", "load", load ? `Load: ${load} kg` : "No load added"),
    createElement("span", "exercise-time", getInitialTimerText(key, isDone, isActive, isPlank, targetDuration))
  );
  card.append(metaRow);

  const controls = createElement("div", "exercise-controls");
  if (isDone) {
    controls.append(
      createButton("Redo", "redo-btn", () => resetExercise(key)),
      createButton("Clear load", "clear-btn", () => clearLoad(key), !load)
    );
  } else if (isActive) {
    controls.append(
      createButton(isPaused ? "Resume" : "Pause", "pause-btn", () => (isPaused ? resumeExercise(key) : pauseExercise(key))),
      createButton("Finish", "finish-btn", () => completeExercise(key)),
      createButton("Load", "load-btn", () => setLoad(key))
    );
  } else {
    controls.append(
      createButton("Start", "start-btn", () => startExercise(key)),
      createButton(load ? "Edit load" : "Add load", "load-btn", () => setLoad(key))
    );
  }
  card.append(controls);

  updateExerciseTimer(card, key);
  if (isActive && !isDone) {
    exerciseIntervals[key] = setInterval(() => {
      updateExerciseTimer(card, key);
      updateSessionSummary();
    }, 1000);
  }

  return card;
}

function createPlankControl(key, targetDuration, isActive, isDone) {
  const wrapper = createElement("div", "plank-clock");
  const ring = createElement("div", "plank-clock-ring");
  ring.append(createElement("span", "plank-clock-value", isDone ? "Done" : formatExerciseTime(targetDuration)));

  const setter = createElement("div", "plank-clock-setter");
  const input = createElement("input", "plank-duration-input");
  input.type = "number";
  input.min = "5";
  input.step = "5";
  input.value = String(Math.round(targetDuration / 1000));
  input.disabled = isActive || isDone;

  const button = createButton("Set sec", "plank-set-btn", () => setPlankDuration(key, input), isActive || isDone);
  setter.append(input, button);
  wrapper.append(ring, setter);
  return wrapper;
}

function getInitialTimerText(key, isDone, isActive, isPlank, targetDuration) {
  if (isDone) {
    const duration = parseInt(localStorage.getItem(durationKey(key)) || "0", 10);
    return duration ? `Done in ${formatExerciseTime(duration)}` : "Completed";
  }

  if (isActive) return `${formatExerciseTime(targetDuration - getExerciseElapsed(key))} left`;
  return isPlank ? "Ready for plank clock" : "Ready for 15 min timer";
}

function clearLoad(key) {
  localStorage.removeItem(`${key}:load`);
  render();
}

function createDayCard(day, index) {
  const card = createElement("button", "card day-card");
  card.type = "button";
  card.style.animationDelay = `${Math.min(index * 45, 260)}ms`;
  card.append(createElement("h3", "", day));
  card.addEventListener("click", () => {
    selectedDay = day;
    showAll = false;
    render();
  });
  return card;
}

function toggleView() {
  showAll = !showAll;
  if (!showAll) selectedDay = today;
  render();
}

function render() {
  clearExerciseIntervals();
  clearInterval(sessionInterval);
  container.textContent = "";

  toggleViewBtn.textContent = showAll ? "Today" : "Week";
  toggleViewBtn.setAttribute("aria-label", showAll ? "Show today's workout" : "Show weekly plan");
  dayTitle.textContent = showAll ? "Weekly plan" : selectedDay;

  const fragment = document.createDocumentFragment();
  if (showAll) {
    Object.keys(workoutPlan).forEach((day, index) => {
      fragment.append(createDayCard(day, index));
    });
  } else {
    workoutPlan[selectedDay].forEach((exercise, index) => {
      fragment.append(createCard(exercise, index, selectedDay));
    });
  }

  container.append(fragment);
  updateProgress();
  updateWaterUI();
  updateStreak();
  updateSessionSummary();

  sessionInterval = setInterval(updateSessionSummary, 1000);
}

render();


const workoutPlan = {
  Monday: [
    { name: "Barbell Squat", reps: "4 × 12" },
    { name: "Bench Press", reps: "4 × 10" },
    { name: "Lat Pulldown", reps: "4 × 10" },
    { name: "Dumbbell Shoulder Press", reps: "3 × 12" },
    { name: "Plank", reps: "3 × 45 sec" },
    { name: "Treadmill Incline Walk", reps: "20 min (Incline 10, Speed 4.5)" }
  ],
  Tuesday: [
    { name: "Jump Rope", reps: "1 min × 5" },
    { name: "Burpees", reps: "10 × 5" },
    { name: "Mountain Climbers", reps: "30 sec × 5" },
    { name: "High Knees", reps: "30 sec × 5" },
    { name: "Leg Raises", reps: "3 × 15" },
    { name: "Russian Twist", reps: "3 × 20" },
    { name: "Cycling", reps: "15 min" }
  ],
  Wednesday: [
    { name: "Squats", reps: "4 × 12" },
    { name: "Lunges", reps: "3 × 12 each leg" },
    { name: "Leg Press", reps: "3 × 12" },
    { name: "Hamstring Curl", reps: "3 × 12" },
    { name: "Calf Raises", reps: "4 × 15" },
    { name: "Treadmill", reps: "20 min (Incline 8)" }
  ],
  Thursday: [
    { name: "Bench Press", reps: "4 × 10" },
    { name: "Lat Pulldown", reps: "4 × 10" },
    { name: "Seated Row", reps: "3 × 12" },
    { name: "Shoulder Press", reps: "3 × 12" },
    { name: "Bicep Curl", reps: "3 × 12" },
    { name: "Tricep Pushdown", reps: "3 × 12" },
    { name: "Incline Walk", reps: "20 min (Incline 10)" }
  ],
  Friday: [
    { name: "Deadlift", reps: "4 × 10" },
    { name: "Kettlebell Swings", reps: "3 × 15" },
    { name: "Step Ups", reps: "3 × 12" },
    { name: "Pushups", reps: "3 × 12" },
    { name: "Battle Rope", reps: "30 sec × 5" },
    { name: "Treadmill", reps: "20 min (Incline 7)" }
  ],
  Saturday: [
    { name: "Walk", reps: "6–7 km" },
    { name: "OR Treadmill", reps: "40 min (Incline 6)" },
    { name: "OR Cross Trainer", reps: "30 min" },
    { name: "Leg Raises", reps: "3 × 15" },
    { name: "Plank", reps: "3 × 1 min" }
  ],
  Sunday: [
    { name: "Rest Day 😴", reps: "" }
  ]
};


// ========= KEEP YOUR workoutPlan ABOVE THIS =========

// -------- GLOBAL STATE --------
let showAll = false;
let selectedDay = new Date().toLocaleString('en-US', { weekday: 'long' });
const EXERCISE_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_PLANK_DURATION_MS = 60 * 1000;
let exerciseIntervals = {};




const today = new Date().toLocaleString('en-US', { weekday: 'long' });
const dateKey = new Date().toISOString().split('T')[0];

const container = document.getElementById("exerciseContainer");
document.getElementById("dayTitle").innerText = today;

// -------- WATER TRACKER --------
function addWater() {
  let water = parseInt(localStorage.getItem(dateKey + "-water") || "0");
  water++;
  localStorage.setItem(dateKey + "-water", water);
  updateWaterUI();
}

function updateWaterUI() {
  const water = localStorage.getItem(dateKey + "-water") || 0;
  document.getElementById("water").innerText = `💧 Water: ${water} glasses`;
}

// -------- STREAK SYSTEM --------
function updateStreak() {
  const last = localStorage.getItem("lastCompletedDate");
  let streak = parseInt(localStorage.getItem("streak") || "0");

  document.getElementById("streak").innerText = `🔥 Streak: ${streak} days`;
}

// -------- REST TIMER --------
let timerInterval;

function startRestTimer() {
  let time = 60;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    document.getElementById("timer").innerText = `⏱ Rest: ${time}s`;
    time--;

    if (time < 0) {
      clearInterval(timerInterval);
      document.getElementById("timer").innerText = "✅ Go Again!";
    }
  }, 1000);
}

// -------- RESET DAY --------
function resetDay() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(today)) {
      localStorage.removeItem(key);
    }
  });

  location.reload();
}

function formatExerciseTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clearExerciseIntervals() {
  Object.values(exerciseIntervals).forEach(interval => clearInterval(interval));
  exerciseIntervals = {};
}

function getExerciseStartKey(key) {
  return key + "-startedAt";
}

function getExerciseDurationKey(key) {
  return key + "-duration";
}

function getExerciseTargetKey(key) {
  return key + "-target";
}

function getExercisePausedAtKey(key) {
  return key + "-pausedAt";
}

function getExercisePausedTotalKey(key) {
  return key + "-pausedTotal";
}

function getExerciseElapsed(key) {
  const startedAt = parseInt(localStorage.getItem(getExerciseStartKey(key)) || "0");
  if (!startedAt) return 0;

  const pausedAt = parseInt(localStorage.getItem(getExercisePausedAtKey(key)) || "0");
  const pausedTotal = parseInt(localStorage.getItem(getExercisePausedTotalKey(key)) || "0");
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

  if (minuteMatch) return parseInt(minuteMatch[1]) * 60 * 1000;
  if (secondMatch) return parseInt(secondMatch[1]) * 1000;

  return DEFAULT_PLANK_DURATION_MS;
}

function getExerciseTargetDuration(key) {
  return parseInt(localStorage.getItem(getExerciseTargetKey(key)) || EXERCISE_DURATION_MS);
}

function setPlankDuration(key, input) {
  const seconds = parseInt(input.value || "0");
  if (!seconds || seconds < 5) {
    alert("Set at least 5 seconds for plank.");
    return;
  }

  localStorage.setItem(getExerciseTargetKey(key), (seconds * 1000).toString());
  render();
}

function startExercise(card, key) {
  if (localStorage.getItem(key) === "done") return;

  localStorage.setItem(getExerciseStartKey(key), Date.now().toString());
  localStorage.setItem(getExercisePausedTotalKey(key), "0");
  localStorage.removeItem(getExercisePausedAtKey(key));
  localStorage.removeItem(getExerciseDurationKey(key));
  updateExerciseTimer(card, key);

  clearInterval(exerciseIntervals[key]);
  exerciseIntervals[key] = setInterval(() => {
    updateExerciseTimer(card, key);
  }, 1000);

  render();
}

function pauseExercise(key) {
  if (localStorage.getItem(key) === "done") return;
  if (!localStorage.getItem(getExerciseStartKey(key))) return;
  if (localStorage.getItem(getExercisePausedAtKey(key))) return;

  localStorage.setItem(getExercisePausedAtKey(key), Date.now().toString());
  render();
}

function resumeExercise(key) {
  const pausedAt = parseInt(localStorage.getItem(getExercisePausedAtKey(key)) || "0");
  if (!pausedAt) return;

  const pausedTotal = parseInt(localStorage.getItem(getExercisePausedTotalKey(key)) || "0");
  localStorage.setItem(getExercisePausedTotalKey(key), (pausedTotal + Date.now() - pausedAt).toString());
  localStorage.removeItem(getExercisePausedAtKey(key));
  render();
}

function completeExercise(card, key) {
  const duration = getExerciseElapsed(key) || getExerciseTargetDuration(key);

  clearInterval(exerciseIntervals[key]);
  delete exerciseIntervals[key];

  localStorage.setItem(key, "done");
  localStorage.setItem(getExerciseDurationKey(key), duration.toString());
  localStorage.removeItem(getExerciseStartKey(key));
  localStorage.removeItem(getExercisePausedAtKey(key));
  localStorage.removeItem(getExercisePausedTotalKey(key));

  card.classList.remove("active");
  card.classList.remove("paused");
  card.classList.add("done");
  card.style.setProperty("--exercise-progress", "100%");

  const timerText = card.querySelector(".exercise-time");
  if (timerText) timerText.innerText = `Done in ${formatExerciseTime(duration)}`;

  updateProgress();
  updateSessionSummary();
  render();
}

function resetExercise(key) {
  clearInterval(exerciseIntervals[key]);
  delete exerciseIntervals[key];

  localStorage.removeItem(key);
  localStorage.removeItem(getExerciseStartKey(key));
  localStorage.removeItem(getExerciseDurationKey(key));
  localStorage.removeItem(getExercisePausedAtKey(key));
  localStorage.removeItem(getExercisePausedTotalKey(key));

  updateProgress();
  updateSessionSummary();
  render();
}

function updateExerciseTimer(card, key) {
  const startedAt = parseInt(localStorage.getItem(getExerciseStartKey(key)) || "0");
  const pausedAt = parseInt(localStorage.getItem(getExercisePausedAtKey(key)) || "0");
  const timerText = card.querySelector(".exercise-time");
  const clockValue = card.querySelector(".plank-clock-value");
  const targetDuration = getExerciseTargetDuration(key);

  if (!startedAt || localStorage.getItem(key) === "done") {
    if (timerText && localStorage.getItem(key) === "done") {
      const duration = parseInt(localStorage.getItem(getExerciseDurationKey(key)) || "0");
      timerText.innerText = duration ? `Done in ${formatExerciseTime(duration)}` : "Completed";
    }
    if (clockValue && localStorage.getItem(key) === "done") {
      clockValue.innerText = "Done";
      card.style.setProperty("--plank-progress", "100%");
    }
    return;
  }

  const elapsed = getExerciseElapsed(key);
  const percent = Math.min((elapsed / targetDuration) * 100, 100);
  const remaining = targetDuration - elapsed;

  card.classList.add("active");
  card.style.setProperty("--exercise-progress", percent + "%");
  card.style.setProperty("--plank-progress", percent + "%");

  if (pausedAt) {
    card.classList.add("paused");
    if (timerText) {
      timerText.innerText = `Paused at ${formatExerciseTime(elapsed)}`;
    }
    if (clockValue) {
      clockValue.innerText = formatExerciseTime(remaining);
    }
    return;
  }

  card.classList.remove("paused");

  if (timerText) {
    timerText.innerText = `In progress: ${formatExerciseTime(remaining)} left`;
  }

  if (clockValue) {
    clockValue.innerText = formatExerciseTime(remaining);
  }

  if (elapsed >= targetDuration) {
    completeExercise(card, key);
  }
}

function updateSessionSummary() {
  const exercises = workoutPlan[selectedDay];
  let totalDuration = 0;
  let completed = 0;

  exercises.forEach((_, index) => {
    const key = `${selectedDay}-${index}`;
    const duration = parseInt(localStorage.getItem(getExerciseDurationKey(key)) || "0");
    if (localStorage.getItem(key) === "done") {
      completed++;
      totalDuration += duration;
    } else if (localStorage.getItem(getExerciseStartKey(key))) {
      totalDuration += getExerciseElapsed(key);
    }
  });

  const summary = document.getElementById("sessionSummary");
  if (summary) {
    summary.innerText = `Training time: ${formatExerciseTime(totalDuration)} | ${completed} done`;
  }
}

// -------- WEIGHT TRACKING --------
function setWeight(key) {
  const weight = prompt("Enter weight (kg):");

  if (weight) {
    localStorage.setItem(key + "-weight", weight);
    render();
  }
}

// -------- TOGGLE VIEW --------

function toggleView() {
  showAll = !showAll;

  // when going back to single view, reset to today
  if (!showAll) {
    selectedDay = today;
  }

  render();
}

// -------- PROGRESS --------
function updateProgress() {
  const progressDay = selectedDay;
  const exercises = workoutPlan[progressDay];
  const total = exercises.length;

  let done = 0;

  exercises.forEach((_, index) => {
    if (localStorage.getItem(`${progressDay}-${index}`) === "done") {
      done++;
    }
  });

  const percent = (done / total) * 100;

  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progressText").innerText = `${done}/${total} completed`;

  // reward + streak
  if (done === total && total > 0 && progressDay === today) {
    document.getElementById("progressText").innerText += " 🎉 Done!";

    const last = localStorage.getItem("lastCompletedDate");
    let streak = parseInt(localStorage.getItem("streak") || "0");

    if (last !== dateKey) {
      streak++;
      localStorage.setItem("streak", streak);
      localStorage.setItem("lastCompletedDate", dateKey);
    }

    updateStreak();
  }
}

// -------- CARD CREATION --------
function createCard(exercise, index, day) {
  const card = document.createElement("div");
  card.classList.add("card");

  const key = `${day}-${index}`;
  const isPlank = isPlankExercise(exercise);
  if (isPlank && !localStorage.getItem(getExerciseTargetKey(key))) {
    localStorage.setItem(getExerciseTargetKey(key), getDefaultPlankDuration(exercise).toString());
  }

  const isDone = localStorage.getItem(key) === "done";
  if (isDone) card.classList.add("done");
  const isActive = localStorage.getItem(getExerciseStartKey(key));
  if (isActive && !isDone) card.classList.add("active");
  const isPaused = localStorage.getItem(getExercisePausedAtKey(key));
  if (isPaused && !isDone) card.classList.add("paused");

  const weight = localStorage.getItem(key + "-weight");
  const duration = parseInt(localStorage.getItem(getExerciseDurationKey(key)) || "0");
  const controlLabel = isPaused ? "Resume" : "Pause";
  const targetDuration = getExerciseTargetDuration(key);
  const targetSeconds = Math.round(targetDuration / 1000);

  card.innerHTML = `
    <h3>${exercise.name}</h3>
    <p>${exercise.reps}</p>
    ${isPlank ? `
      <div class="plank-clock">
        <div class="plank-clock-ring">
          <span class="plank-clock-value">${isDone ? "Done" : formatExerciseTime(targetDuration)}</span>
        </div>
        <div class="plank-clock-setter">
          <input class="plank-duration-input" type="number" min="5" step="5" value="${targetSeconds}" ${isActive || isDone ? "disabled" : ""}>
          <button class="plank-set-btn" type="button" ${isActive || isDone ? "disabled" : ""}>Set sec</button>
        </div>
      </div>
    ` : ""}
    <div class="weight">
      ${weight ? "🏋️ " + weight + " kg" : "➕ Add Weight"}
    </div>
    <div class="exercise-time">${isDone ? duration ? "Done in " + formatExerciseTime(duration) : "Completed" : isActive ? "Starting..." : isPlank ? "Tap to start plank clock" : "Tap to start 15 min"}</div>
    ${isActive && !isDone ? `
      <div class="exercise-controls">
        <button class="pause-btn" type="button">${controlLabel}</button>
        <button class="finish-btn" type="button">Finish</button>
      </div>
    ` : ""}
    ${isDone ? `
      <div class="exercise-controls">
        <button class="redo-btn" type="button">Redo</button>
      </div>
    ` : ""}
  `;

  updateExerciseTimer(card, key);
  if (isActive && !isDone) {
    exerciseIntervals[key] = setInterval(() => {
      updateExerciseTimer(card, key);
      updateSessionSummary();
    }, 1000);
  }

  let clickTimeout;

  // tap = start exercise timer
  card.addEventListener("click", () => {
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      if (localStorage.getItem(getExerciseStartKey(key))) {
        completeExercise(card, key);
      } else {
        startExercise(card, key);
      }
    }, 220);
  });

  // double tap = add weight
  card.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    clearTimeout(clickTimeout);
    setWeight(key);
  });

  const plankInput = card.querySelector(".plank-duration-input");
  const plankSetButton = card.querySelector(".plank-set-btn");
  if (plankInput) {
    plankInput.addEventListener("click", (e) => e.stopPropagation());
    plankInput.addEventListener("dblclick", (e) => e.stopPropagation());
  }
  if (plankSetButton && plankInput) {
    plankSetButton.addEventListener("click", (e) => {
      e.stopPropagation();
      clearTimeout(clickTimeout);
      setPlankDuration(key, plankInput);
    });
  }

  const pauseButton = card.querySelector(".pause-btn");
  if (pauseButton) {
    pauseButton.addEventListener("click", (e) => {
      e.stopPropagation();
      clearTimeout(clickTimeout);
      if (localStorage.getItem(getExercisePausedAtKey(key))) {
        resumeExercise(key);
      } else {
        pauseExercise(key);
      }
    });
  }

  const finishButton = card.querySelector(".finish-btn");
  if (finishButton) {
    finishButton.addEventListener("click", (e) => {
      e.stopPropagation();
      clearTimeout(clickTimeout);
      completeExercise(card, key);
    });
  }

  const redoButton = card.querySelector(".redo-btn");
  if (redoButton) {
    redoButton.addEventListener("click", (e) => {
      e.stopPropagation();
      clearTimeout(clickTimeout);
      resetExercise(key);
    });
  }

  return card;
}

// -------- RENDER FUNCTION --------



function render() {
  clearExerciseIntervals();
  container.innerHTML = "";

  if (showAll) {
    // ===== WEEK VIEW (ONLY DAY NAMES) =====
    Object.keys(workoutPlan).forEach(day => {

      const dayCard = document.createElement("div");
      dayCard.classList.add("card");

      dayCard.innerHTML = `
        <h3>📅 ${day}</h3>
      `;

      // click → open that day
      dayCard.addEventListener("click", () => {
        selectedDay = day;
        showAll = false;
        render();
      });

      container.appendChild(dayCard);
    });

  } else {
    // ===== SINGLE DAY VIEW =====
    document.getElementById("dayTitle").innerText = selectedDay;

    workoutPlan[selectedDay].forEach((ex, i) => {
      container.appendChild(createCard(ex, i, selectedDay));
    });
  }

  updateProgress();
  updateWaterUI();
  updateStreak();
  updateSessionSummary();
}

// -------- INITIAL LOAD --------
render();

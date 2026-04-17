
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

function startExercise(card, key) {
  if (localStorage.getItem(key) === "done") return;

  localStorage.setItem(getExerciseStartKey(key), Date.now().toString());
  updateExerciseTimer(card, key);

  clearInterval(exerciseIntervals[key]);
  exerciseIntervals[key] = setInterval(() => {
    updateExerciseTimer(card, key);
  }, 1000);
}

function completeExercise(card, key) {
  const startedAt = parseInt(localStorage.getItem(getExerciseStartKey(key)) || "0");
  const duration = startedAt ? Date.now() - startedAt : EXERCISE_DURATION_MS;

  clearInterval(exerciseIntervals[key]);
  delete exerciseIntervals[key];

  localStorage.setItem(key, "done");
  localStorage.setItem(getExerciseDurationKey(key), duration.toString());
  localStorage.removeItem(getExerciseStartKey(key));

  card.classList.remove("active");
  card.classList.add("done");
  card.style.setProperty("--exercise-progress", "100%");

  const timerText = card.querySelector(".exercise-time");
  if (timerText) timerText.innerText = `Done in ${formatExerciseTime(duration)}`;

  updateProgress();
}

function updateExerciseTimer(card, key) {
  const startedAt = parseInt(localStorage.getItem(getExerciseStartKey(key)) || "0");
  const timerText = card.querySelector(".exercise-time");

  if (!startedAt || localStorage.getItem(key) === "done") {
    if (timerText && localStorage.getItem(key) === "done") {
      const duration = parseInt(localStorage.getItem(getExerciseDurationKey(key)) || "0");
      timerText.innerText = duration ? `Done in ${formatExerciseTime(duration)}` : "Completed";
    }
    return;
  }

  const elapsed = Date.now() - startedAt;
  const percent = Math.min((elapsed / EXERCISE_DURATION_MS) * 100, 100);
  const remaining = EXERCISE_DURATION_MS - elapsed;

  card.classList.add("active");
  card.style.setProperty("--exercise-progress", percent + "%");

  if (timerText) {
    timerText.innerText = `In progress: ${formatExerciseTime(remaining)} left`;
  }

  if (elapsed >= EXERCISE_DURATION_MS) {
    completeExercise(card, key);
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

  const isDone = localStorage.getItem(key) === "done";
  if (isDone) card.classList.add("done");
  const isActive = localStorage.getItem(getExerciseStartKey(key));
  if (isActive && !isDone) card.classList.add("active");

  const weight = localStorage.getItem(key + "-weight");
  const duration = parseInt(localStorage.getItem(getExerciseDurationKey(key)) || "0");

  card.innerHTML = `
    <h3>${exercise.name}</h3>
    <p>${exercise.reps}</p>
    <div class="weight">
      ${weight ? "🏋️ " + weight + " kg" : "➕ Add Weight"}
    </div>
    <div class="exercise-time">${isDone ? duration ? "Done in " + formatExerciseTime(duration) : "Completed" : isActive ? "Starting..." : "Tap to start 15 min"}</div>
  `;

  updateExerciseTimer(card, key);
  if (isActive && !isDone) {
    exerciseIntervals[key] = setInterval(() => {
      updateExerciseTimer(card, key);
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
}

// -------- INITIAL LOAD --------
render();

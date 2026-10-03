const PRESETS = {
  'Day 1 (Upper + Delts)': [
    {
      name: 'Dual Cable Cross-Body Lateral Raise',
      category: 'Shoulders (Side)',
      sets: 3,
    },
    { name: 'Incline Chest Press (Machine/Smith)', category: 'Chest', sets: 3 },
    { name: 'Chest-Supported Neutral Row', category: 'Back', sets: 3 },
    { name: 'Hack Squat or Pendulum Squat', category: 'Legs', sets: 3 },
    {
      name: 'Overhead Dual-Cable Triceps Extension',
      category: 'Arms',
      sets: 3,
    },
  ],
  'Day 2 (Overhead + Legs/Back)': [
    {
      name: 'Seated Overhead Shoulder Press',
      category: 'Shoulders (Press)',
      sets: 3,
    },
    { name: 'Romanian Deadlift (RDL)', category: 'Legs', sets: 3 },
    { name: 'Seated Cable Lat Pulldown', category: 'Back', sets: 3 },
    { name: 'Flat Chest Press (Machine/DB)', category: 'Chest', sets: 3 },
    { name: 'Incline DB Biceps Curl', category: 'Arms', sets: 3 },
    {
      name: 'Leaning Cable Lateral Raise',
      category: 'Shoulders (Side)',
      sets: 3,
    },
  ],
  'Day 3 (Delts Hypertrophy)': [
    { name: 'Machine Lateral Raise', category: 'Shoulders (Side)', sets: 4 },
    { name: 'Rear Delt Pec Deck Fly', category: 'Shoulders (Side)', sets: 3 },
    { name: 'Chest-Supported Wide Row', category: 'Back', sets: 3 },
    { name: 'Leg Press', category: 'Legs', sets: 3 },
    { name: 'Seated Leg Curl', category: 'Legs', sets: 3 },
    { name: 'Cable Triceps Pushdown', category: 'Arms', sets: 3 },
  ],
  Custom: [],
}

let sessionPlan = []

const scriptUrlInput = document.getElementById('scriptUrl')
const workoutDate = document.getElementById('workoutDate')
const weekSelect = document.getElementById('weekSelect')
const daySelect = document.getElementById('daySelect')
const newCategory = document.getElementById('newCategory')
const newSets = document.getElementById('newSets')
const newExerciseName = document.getElementById('newExerciseName')
const exerciseQueue = document.getElementById('exerciseQueue')
const countDisplay = document.getElementById('countDisplay')

const planView = document.getElementById('planView')
const activeSessionView = document.getElementById('activeSessionView')
const allExercisesContainer = document.getElementById('allExercisesContainer')
const sessionTitle = document.getElementById('sessionTitle')
const sessionMeta = document.getElementById('sessionMeta')

// Init
workoutDate.value = new Date().toISOString().split('T')[0]
const savedUrl = localStorage.getItem('workout_script_url')
if (savedUrl) scriptUrlInput.value = savedUrl

// Load initial preset
loadPreset(daySelect.value)

daySelect.addEventListener('change', () => {
  loadPreset(daySelect.value)
})

function loadPreset(presetKey) {
  if (PRESETS[presetKey]) {
    // Deep clone
    sessionPlan = JSON.parse(JSON.stringify(PRESETS[presetKey]))
    renderPlanQueue()
  }
}

// Add single manual exercise
document.getElementById('addExerciseBtn').addEventListener('click', () => {
  const name = newExerciseName.value.trim()
  const sets = parseInt(newSets.value, 10)
  const cat = newCategory.value

  if (!name) return alert('Enter an exercise name')

  sessionPlan.push({ name, category: cat, sets: sets || 3 })
  newExerciseName.value = ''
  renderPlanQueue()
})

function renderPlanQueue() {
  countDisplay.textContent = sessionPlan.length
  if (sessionPlan.length === 0) {
    exerciseQueue.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">No exercises added yet.</p>'
    return
  }

  exerciseQueue.innerHTML = sessionPlan
    .map(
      (item, idx) => `
        <div class="builder-item">
          <div class="builder-item-info">
            <strong>${item.name}</strong>
            <span>${item.category} • ${item.sets} Sets</span>
          </div>
          <button type="button" class="remove-btn" onclick="removeExercise(${idx})">✕</button>
        </div>
      `,
    )
    .join('')
}

window.removeExercise = function (idx) {
  sessionPlan.splice(idx, 1)
  renderPlanQueue()
}

// Transition to Active Workout
document.getElementById('startWorkoutBtn').addEventListener('click', () => {
  if (sessionPlan.length === 0)
    return alert('Please add at least one exercise.')
  if (scriptUrlInput.value.trim()) {
    localStorage.setItem('workout_script_url', scriptUrlInput.value.trim())
  }

  sessionTitle.textContent = daySelect.value
  sessionMeta.textContent = `${workoutDate.value} • ${weekSelect.value}`

  buildActiveWorkoutScreen()
  planView.style.display = 'none'
  activeSessionView.style.display = 'block'
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

document.getElementById('editSessionBtn').addEventListener('click', () => {
  activeSessionView.style.display = 'none'
  planView.style.display = 'block'
})

function buildActiveWorkoutScreen() {
  allExercisesContainer.innerHTML = sessionPlan
    .map((ex, exIdx) => {
      let rowsHtml = ''
      for (let s = 1; s <= ex.sets; s++) {
        rowsHtml += `
            <div class="set-row" id="row-${exIdx}-${s}">
              <div class="set-label">Set ${s}</div>
              <div class="input-cell">
                <span>KG / LBS</span>
                <input type="number" step="0.5" id="weight-${exIdx}-${s}" placeholder="wt" />
              </div>
              <div class="input-cell">
                <span>Reps</span>
                <input type="number" id="reps-${exIdx}-${s}" placeholder="reps" />
              </div>
              <div class="input-cell">
                <span>RIR</span>
                <input type="number" id="rir-${exIdx}-${s}" placeholder="rir" />
              </div>
              <button type="button" class="btn-log" id="btn-${exIdx}-${s}" onclick="submitSet(${exIdx}, ${s})">Log</button>
            </div>
          `
      }

      return `
          <div class="exercise-block">
            <div class="exercise-header">
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-sub">${ex.category} • ${ex.sets} Sets</div>
            </div>
            ${rowsHtml}
          </div>
        `
    })
    .join('')
}

// Direct submit per set row
window.submitSet = async function (exIdx, setNum) {
  const scriptUrl = scriptUrlInput.value.trim()
  if (!scriptUrl) return alert('Missing Google Apps Script URL.')

  const ex = sessionPlan[exIdx]
  const weightInput = document.getElementById(`weight-${exIdx}-${setNum}`)
  const repsInput = document.getElementById(`reps-${exIdx}-${setNum}`)
  const rirInput = document.getElementById(`rir-${exIdx}-${setNum}`)
  const row = document.getElementById(`row-${exIdx}-${setNum}`)
  const btn = document.getElementById(`btn-${exIdx}-${setNum}`)

  if (!weightInput.value || !repsInput.value) {
    return alert('Please enter both weight and reps.')
  }

  btn.disabled = true
  btn.textContent = '...'

  const payload = {
    date: workoutDate.value,
    week: weekSelect.value,
    day: daySelect.value,
    category: ex.category,
    exercise: ex.name,
    set: setNum,
    reps: parseInt(repsInput.value, 10),
    weight: parseFloat(weightInput.value),
    rir: rirInput.value !== '' ? parseFloat(rirInput.value) : '', // <--- Sends clean RIR value
    notes: '',
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })

    row.classList.add('logged')
    btn.textContent = '✓'
    btn.classList.add('done')
  } catch (err) {
    console.error(err)
    alert('Failed to log set. Check internet or URL.')
    btn.disabled = false
    btn.textContent = 'Log'
  }
}

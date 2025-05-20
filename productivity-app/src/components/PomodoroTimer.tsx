import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import alarmSoundFile from '../assets/alarm-sound.mp3'; // Import the sound file
import type { PomodoroSettings } from '../types'; // Import PomodoroSettings type
import GreenCheckmark from './goals/GreenCheckmark';
import { addTask } from '../utils/todoLocalStorage';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const DOING_LIST_KEY = 'pomodoroDoingList';
const DOING_CHECKMARKS_KEY = 'pomodoroDoingCheckmarks';
const DONE_LOG_KEY = 'pomodoroDoneLog';
const POMODORO_TIMER_STATE_KEY = 'pomodoroTimerState';

const PomodoroTimer: React.FC = () => {
  const { pomodoroSettings, addCompletedPomodoro, updatePomodoroSettings } = useAppContext();
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref to hold the audio object

  // Setup audio object once
  useEffect(() => {
    audioRef.current = new Audio(alarmSoundFile);
    audioRef.current.volume = 0.5;
    return () => { // Cleanup an existing timer if the component unmounts
      if (audioRef.current?.dataset.timerId) {
        clearTimeout(Number(audioRef.current.dataset.timerId));
      }
    };
  }, []);

  const playAlertSound = useCallback(() => {
    if (audioRef.current) {
      // Clear any existing timeout to prevent multiple stop triggers
      if (audioRef.current.dataset.timerId) {
        clearTimeout(Number(audioRef.current.dataset.timerId));
      }
      audioRef.current.currentTime = 0; // Rewind to start
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
      
      const timerId = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 15000); // Extended alarm duration to 15 seconds
      audioRef.current.dataset.timerId = String(timerId);
    }
  }, []);

  // Load from localStorage or default
  const getInitialDoingList = () => {
    const stored = localStorage.getItem(DOING_LIST_KEY);
    return stored ? JSON.parse(stored) : [''];
  };
  const getInitialCheckmarks = () => {
    const stored = localStorage.getItem(DOING_CHECKMARKS_KEY);
    return stored ? JSON.parse(stored) : [false];
  };
  const getInitialDoneLog = () => {
    const stored = localStorage.getItem(DONE_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const [doingListItems, setDoingListItems] = useState<string[]>(getInitialDoingList);
  const [doingListCheckmarks, setDoingListCheckmarks] = useState<boolean[]>(getInitialCheckmarks);
  const [dailyDoneLog, setDailyDoneLog] = useState<string[]>(getInitialDoneLog);
  const [editingDoneIndex, setEditingDoneIndex] = useState<number | null>(null);
  const [editedDoneText, setEditedDoneText] = useState('');

  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    pomodoroSettings.workDuration * 60
  );
  const [isActive, setIsActive] = useState<boolean>(false);
  const [pomodorosInCycle, setPomodorosInCycle] = useState<number>(0);

  // State for customization modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalWorkDuration, setModalWorkDuration] = useState<number>(pomodoroSettings.workDuration);
  const [modalShortBreakDuration, setModalShortBreakDuration] = useState<number>(pomodoroSettings.shortBreakDuration);
  const [modalLongBreakDuration, setModalLongBreakDuration] = useState<number>(pomodoroSettings.longBreakDuration);

  // State for info modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const infoContent = `
    <h4>Pomodoro Technique Best Practices</h4>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <h5>Key Principles</h5>
    <ul>
      <li>Work in focused sprints</li>
      <li>Take regular breaks</li>
      <li>Track your sessions</li>
      <li>Review and adjust</li>
    </ul>
    <h5>Recommended Reading</h5>
    <ul>
      <li>"The Pomodoro Technique" by Francesco Cirillo</li>
    </ul>
  `;

  // Restore timer state from localStorage on mount
  useEffect(() => {
    const timerState = localStorage.getItem(POMODORO_TIMER_STATE_KEY);
    if (timerState) {
      const { timerMode, secondsRemaining, isActive, pomodorosInCycle, lastUpdated } = JSON.parse(timerState);
      setTimerMode(timerMode);
      setSecondsRemaining(secondsRemaining);
      setPomodorosInCycle(pomodorosInCycle);
      // If browser was closed, pause timer but keep elapsed time
      setIsActive(false);
    }
  }, []);

  // Persist timer state to localStorage
  useEffect(() => {
    localStorage.setItem(POMODORO_TIMER_STATE_KEY, JSON.stringify({
      timerMode,
      secondsRemaining,
      isActive,
      pomodorosInCycle,
      lastUpdated: Date.now(),
    }));
  }, [timerMode, secondsRemaining, isActive, pomodorosInCycle]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(DOING_LIST_KEY, JSON.stringify(doingListItems));
  }, [doingListItems]);
  useEffect(() => {
    localStorage.setItem(DOING_CHECKMARKS_KEY, JSON.stringify(doingListCheckmarks));
  }, [doingListCheckmarks]);
  useEffect(() => {
    localStorage.setItem(DONE_LOG_KEY, JSON.stringify(dailyDoneLog));
  }, [dailyDoneLog]);

  const getDurationForMode = useCallback((mode: TimerMode, currentSettings: PomodoroSettings): number => {
    switch (mode) {
      case 'work':
        return currentSettings.workDuration * 60;
      case 'shortBreak':
        return currentSettings.shortBreakDuration * 60;
      case 'longBreak':
        return currentSettings.longBreakDuration * 60;
      default:
        return currentSettings.workDuration * 60;
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
        setSecondsRemaining(getDurationForMode(timerMode, pomodoroSettings));
    }
  }, [timerMode, pomodoroSettings, getDurationForMode, isActive]);

  useEffect(() => {
    let interval: number | undefined = undefined;

    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      setIsActive(false);
      playAlertSound();
      if (timerMode === 'work') {
        window.alert('Focus session finished! Great Job! Now log results to your Done list to build the habit.');
        addCompletedPomodoro(doingListItems[pomodorosInCycle] || '');
        const newCheckmarks = [...doingListCheckmarks];
        if (pomodorosInCycle < newCheckmarks.length) {
          newCheckmarks[pomodorosInCycle] = true;
        }
        setDoingListCheckmarks(newCheckmarks);
        const newPomodorosInCycle = pomodorosInCycle + 1;
        // Add a new slot for the next Pomodoro
        if (newPomodorosInCycle > doingListItems.length - 1) {
          addDoingSlot();
        }
        if (newPomodorosInCycle >= pomodoroSettings.pomodorosPerLongBreak) {
          setDailyDoneLog(prev => [
            ...prev,
            ...doingListItems.filter((item, idx) => doingListCheckmarks[idx] || idx < newPomodorosInCycle)
          ]);
          setDoingListItems(['']);
          setDoingListCheckmarks([false]);
          setTimerMode('longBreak');
          setPomodorosInCycle(0);
        } else {
          setTimerMode('shortBreak');
          setPomodorosInCycle(newPomodorosInCycle);
        }
      } else { 
        setTimerMode('work');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, timerMode, pomodoroSettings, doingListItems, doingListCheckmarks, pomodorosInCycle, addCompletedPomodoro, playAlertSound, getDurationForMode]);

  const handleStartPause = () => {
    if (!isActive && secondsRemaining === 0) { 
      setSecondsRemaining(getDurationForMode(timerMode, pomodoroSettings));
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimerMode('work');
    setDoingListItems(['']);
    setDoingListCheckmarks([false]);
    setPomodorosInCycle(0);
  };

  const handleSkipBreak = () => {
    if (timerMode === 'shortBreak' || timerMode === 'longBreak') {
      setIsActive(false); 
      setTimerMode('work'); 
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDoingListItemChange = (index: number, value: string) => {
    const newItems = [...doingListItems];
    newItems[index] = value;
    setDoingListItems(newItems);
  };

  const openModal = () => {
    setModalWorkDuration(pomodoroSettings.workDuration);
    setModalShortBreakDuration(pomodoroSettings.shortBreakDuration);
    setModalLongBreakDuration(pomodoroSettings.longBreakDuration);
    setIsModalOpen(true);
  };

  const handleSaveSettings = () => {
    const newDurations = {
      workDuration: modalWorkDuration > 0 ? modalWorkDuration : pomodoroSettings.workDuration,
      shortBreakDuration: modalShortBreakDuration > 0 ? modalShortBreakDuration : pomodoroSettings.shortBreakDuration,
      longBreakDuration: modalLongBreakDuration > 0 ? modalLongBreakDuration : pomodoroSettings.longBreakDuration,
    };
    updatePomodoroSettings(newDurations); // This sends a Partial<PomodoroSettings>

    // Create a complete settings object for getDurationForMode
    const updatedFullSettings: PomodoroSettings = {
      ...pomodoroSettings, // Spread existing settings to keep pomodorosPerLongBreak
      ...newDurations,    // Override with new durations
    };

    if (!isActive) {
      setSecondsRemaining(getDurationForMode(timerMode, updatedFullSettings));
    }
    setIsModalOpen(false);
  };

  // --- Editing Done List ---
  const startEditDone = (index: number, text: string) => {
    setEditingDoneIndex(index);
    setEditedDoneText(text);
  };
  const saveEditDone = (index: number) => {
    if (editedDoneText.trim() !== '') {
      setDailyDoneLog(prev => prev.map((item, i) => i === index ? editedDoneText.trim() : item));
    }
    setEditingDoneIndex(null);
    setEditedDoneText('');
  };
  const cancelEditDone = () => {
    setEditingDoneIndex(null);
    setEditedDoneText('');
  };

  // Add a new slot after each Pomodoro
  const addDoingSlot = () => {
    setDoingListItems(prev => [...prev, '']);
    setDoingListCheckmarks(prev => [...prev, false]);
  };

  // Delete a Doing List item
  const handleDeleteDoingItem = (index: number) => {
    setDoingListItems(prev => prev.filter((_, i) => i !== index));
    setDoingListCheckmarks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddToTodo = (text: string, completed: boolean = false) => {
    if (!text.trim()) return;
    addTask({
      text: text.trim(),
      estimatedTime: '',
      completed,
      listType: completed ? 'done' : 'todo',
    });
    window.alert(`Added to To-Do List as ${completed ? 'completed' : 'uncompleted'} task.`);
  };

  return (
    <>
      <div className='text-center container pb-5'>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Pomodoro Timer</h2>
          <button className="btn btn-outline-info btn-sm" onClick={() => setShowInfoModal(true)} title="Learn more about Pomodoro Technique">
            <i className="bi bi-info-circle"></i>
          </button>
        </div>
        <div className='row justify-content-center mb-3'>
          <div className='col-md-12 col-lg-10'>
            <h5 className="text-start mb-2">Today's Pomodoro Cycle</h5>
            <div className="d-flex flex-column align-items-center gap-3">
              {[0,1,2,3].map((idx) => (
                <React.Fragment key={idx}>
                  <div className="d-flex align-items-center w-100 pomodoro-cycle-row" style={{maxWidth: '900px'}}>
                    <input
                      type='checkbox'
                      className='form-check-input me-2'
                      checked={!!doingListCheckmarks[idx]}
                      onChange={() => {
                        const newCheckmarks = [...doingListCheckmarks];
                        newCheckmarks[idx] = !newCheckmarks[idx];
                        setDoingListCheckmarks(newCheckmarks);
                      }}
                      disabled={false}
                    />
                    {editingDoneIndex === idx ? (
                      <>
                        <input
                          type="text"
                          className="form-control form-control-sm me-2"
                          value={editedDoneText}
                          onChange={e => setEditedDoneText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { setDoingListItems(items => items.map((it, i) => i === idx ? editedDoneText : it)); setEditingDoneIndex(null); setEditedDoneText(''); } if (e.key === 'Escape') { setEditingDoneIndex(null); setEditedDoneText(''); } }}
                          autoFocus
                          style={{maxWidth: 400}}
                        />
                        <button className="btn btn-primary btn-sm me-1" onClick={() => { setDoingListItems(items => items.map((it, i) => i === idx ? editedDoneText : it)); setEditingDoneIndex(null); setEditedDoneText(''); }}>Save</button>
                        <button className="btn btn-secondary btn-sm me-1" onClick={() => { setEditingDoneIndex(null); setEditedDoneText(''); }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <input
                          type='text'
                          className='form-control me-2'
                          placeholder={`Pomodoro ${idx + 1}`}
                          value={doingListItems[idx] || ''}
                          onChange={e => handleDoingListItemChange(idx, e.target.value)}
                          disabled={doingListCheckmarks[idx]}
                          style={{ minWidth: 0, flex: '1 1 200px', maxWidth: 400 }}
                        />
                        <button className="btn btn-outline-secondary btn-sm ms-2" type="button" onClick={() => { setEditingDoneIndex(idx); setEditedDoneText(doingListItems[idx] || ''); }} title="Edit Pomodoro">
                          &#9998;
                        </button>
                      </>
                    )}
                    {doingListCheckmarks[idx] && (
                      <span className="input-group-text bg-light text-dark border border-success ms-2 p-0" style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <GreenCheckmark size={24} />
                      </span>
                    )}
                  </div>
                  {idx < 3 && (
                    <div className="text-center text-muted my-1" style={{width: '100%'}}>
                      <span>Short Break</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <div className="text-center text-info mt-2" style={{width: '100%'}}>
                <span>Long Break after Pomodoro 4</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className='my-4 p-4 rounded shadow-sm' style={{backgroundColor: '#f8f9fa'}}>
          <h3>
            {timerMode === 'work' && 'Work Session'}
            {timerMode === 'shortBreak' && 'Short Break'}
            {timerMode === 'longBreak' && 'Long Break'}
          </h3>
          <h1 className='display-1 fw-bold text-primary'>{formatTime(secondsRemaining)}</h1>
        </div>

        <div className='my-3 d-flex justify-content-center align-items-center flex-wrap'>
          <button 
              className={`btn btn-lg ${isActive ? 'btn-warning' : 'btn-primary'} mx-2 px-4 mb-2`}
              onClick={handleStartPause}
          >
            {isActive ? 'Pause' : (secondsRemaining === 0 && getDurationForMode(timerMode, pomodoroSettings) === secondsRemaining ? 'Start' : 'Start Next') }
          </button>
          <button 
              className='btn btn-lg btn-secondary mx-2 px-4 mb-2' 
              onClick={handleReset} 
              disabled={isActive && secondsRemaining > 0}
          >
            Reset
          </button>
          {(timerMode === 'shortBreak' || timerMode === 'longBreak') && (
            <button 
              className='btn btn-lg btn-info mx-2 px-4 mb-2' 
              onClick={handleSkipBreak} 
              disabled={isActive && secondsRemaining === 0}
            >
              Skip Break
            </button>
          )}
          <button
            className='btn btn-lg btn-outline-secondary mx-2 px-4 mb-2'
            onClick={openModal}
          >
            Customize
          </button>
        </div>

        {isModalOpen && (
          <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Customize Durations (minutes)</h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="workDuration" className="form-label">Work Duration:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="workDuration"
                      min="1"
                      value={modalWorkDuration}
                      onChange={(e) => setModalWorkDuration(Math.max(1, parseInt(e.target.value, 10) || pomodoroSettings.workDuration))}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="shortBreakDuration" className="form-label">Short Break:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="shortBreakDuration"
                      min="1"
                      value={modalShortBreakDuration}
                      onChange={(e) => setModalShortBreakDuration(Math.max(1, parseInt(e.target.value, 10) || pomodoroSettings.shortBreakDuration))}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="longBreakDuration" className="form-label">Long Break:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="longBreakDuration"
                      min="1"
                      value={modalLongBreakDuration}
                      onChange={(e) => setModalLongBreakDuration(Math.max(1, parseInt(e.target.value, 10) || pomodoroSettings.longBreakDuration))}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveSettings}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='mt-4 text-muted'>
          <p>Pomodoros completed in this cycle: {pomodorosInCycle} / {pomodoroSettings.pomodorosPerLongBreak}</p>
          <p>Work: {pomodoroSettings.workDuration}min | Short Break: {pomodoroSettings.shortBreakDuration}min | Long Break: {pomodoroSettings.longBreakDuration}min</p>
        </div>

        {dailyDoneLog.length > 0 && (
          <div className="mt-5 pt-3 border-top">
            <h4 className="mb-3 text-start">Today's Achievements</h4>
            <ul className="list-group text-start">
              {dailyDoneLog.map((item, index) => (
                <li key={index} className="list-group-item d-flex align-items-center">
                  {editingDoneIndex === index ? (
                    <>
                      <input
                        type="text"
                        className="form-control form-control-sm me-2"
                        value={editedDoneText}
                        onChange={e => setEditedDoneText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditDone(index); if (e.key === 'Escape') cancelEditDone(); }}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm me-1" onClick={() => saveEditDone(index)}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelEditDone}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{item}</span>
                      <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => startEditDone(index, item)} title="Edit achievement">
                        &#9998;
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showInfoModal && (
          <>
            <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
            <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-scrollable modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Pomodoro Guide</h5>
                    <button type="button" className="btn-close" onClick={() => setShowInfoModal(false)} aria-label="Close"></button>
                  </div>
                  <div className="modal-body" dangerouslySetInnerHTML={{ __html: infoContent }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        .pomodoro-cycle-row {
          max-width: 900px;
        }
        @media (max-width: 767px) {
          .pomodoro-cycle-row {
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  );
};

export default PomodoroTimer; 
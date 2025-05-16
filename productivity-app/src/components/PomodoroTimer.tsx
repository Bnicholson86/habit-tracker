import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import alarmSoundFile from '../assets/alarm-sound.mp3'; // Import the sound file
import type { PomodoroSettings } from '../types'; // Import PomodoroSettings type

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

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

  const [doingListItems, setDoingListItems] = useState<string[]>(['', '', '', '']);
  const [doingListCheckmarks, setDoingListCheckmarks] = useState<boolean[]>([false, false, false, false]);
  const [dailyDoneLog, setDailyDoneLog] = useState<string[]>([]);

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

        if (newPomodorosInCycle >= pomodoroSettings.pomodorosPerLongBreak) {
          setDailyDoneLog(prevLog => [
            ...prevLog,
            ...doingListItems.filter(item => item.trim() !== '')
          ]);
          setDoingListItems(['', '', '', '']);
          setDoingListCheckmarks([false, false, false, false]);
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
    setDoingListItems(['', '', '', '']);
    setDoingListCheckmarks([false, false, false, false]);
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

  return (
    <div className='text-center container pb-5'>
      <h2 className='mb-3'>Pomodoro Timer</h2>
      <div className='row justify-content-center mb-3'>
        <div className='col-md-8 col-lg-6'>
          <h5 className="text-start mb-2">The Doing List</h5>
          {doingListItems.map((item, index) => (
            <div key={index} className="input-group mb-2">
              <input
                type='text'
                className='form-control'
                placeholder={`Task ${index + 1}`}
                value={item}
                onChange={(e) => handleDoingListItemChange(index, e.target.value)}
                disabled={isActive || doingListCheckmarks[index]}
              />
              {doingListCheckmarks[index] && (
                <span className="input-group-text bg-success text-white">✔️</span>
              )}
            </div>
          ))}
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
              <li key={index} className="list-group-item">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer; 
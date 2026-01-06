<template>
  <div id="app">
    <p class="clock">
      <Flip
        :parts="displayParts"
        :sub-label="subLabel"
        :scale="clockScale"
        :key="displayParts.length"
      />
    </p>
    <ClockControls
      :show-seconds="showSeconds"
      :is24h="is24h"
      :mode="mode"
      :countdown-seconds="countdownSeconds"
      :countdown-remaining="countdownRemaining"
      :pomodoro-work-seconds="pomodoroWorkSeconds"
      :pomodoro-break-seconds="pomodoroBreakSeconds"
      :pomodoro-remaining="pomodoroRemaining"
      :pomodoro-running="pomodoroRunning"
      :stopwatch-running="stopwatchRunning"
      :countdown-running="countdownRunning"
      :clock-scale="clockScalePercent"
      @toggle-seconds="toggleSeconds"
      @toggle-24h="toggle24h"
      @start-countdown="startCountdown"
      @pause-countdown="pauseCountdown"
      @resume-countdown="resumeCountdown"
      @stop-countdown="stopCountdown"
      @start-pomodoro="startPomodoro"
      @pause-pomodoro="pausePomodoro"
      @resume-pomodoro="resumePomodoro"
      @stop-pomodoro="stopPomodoro"
      @start-stopwatch="startStopwatch"
      @stop-stopwatch="stopStopwatch"
      @reset-stopwatch="resetStopwatch"
      @open-stopwatch="openStopwatch"
      @exit-stopwatch="exitStopwatch"
      @open-countdown="openCountdown"
      @exit-countdown="exitCountdown"
      @open-pomodoro="openPomodoro"
      @exit-pomodoro="exitPomodoro"
      @update-clock-scale="updateClockScale"
    />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import Flip from "./components/Flip";
import ClockControls from "./components/ClockControls";

export default {
  name: "App",
  components: {
    Flip,
    ClockControls
  },
  setup() {
    const showSeconds = ref(true);
    const is24h = ref(true);
    const mode = ref("clock");
    const now = ref(new Date());

    const countdownSeconds = ref(10 * 60);
    const countdownRemaining = ref(0);
    const countdownRunning = ref(false);

    const pomodoroPhase = ref("work");
    const pomodoroRemaining = ref(0);
    const pomodoroRunning = ref(false);
    const pomodoroWorkSeconds = ref(25 * 60);
    const pomodoroBreakSeconds = ref(5 * 60);

    const stopwatchElapsed = ref(0);
    const stopwatchRunning = ref(false);

    const clockScalePercent = ref(80);

    const clockScale = computed(() => {
      const percent = Math.min(100, Math.max(0, clockScalePercent.value));
      return 0.6 + (percent / 100) * 0.5;
    });

    const pad2 = (value) => String(value).padStart(2, "0");

    const getTimeParts = (date) => {
      const hours24 = date.getHours();
      const hours = is24h.value ? hours24 : ((hours24 + 11) % 12) + 1;
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      if (showSeconds.value) {
        return [pad2(hours), pad2(minutes), pad2(seconds)];
      }
      return [pad2(hours), pad2(minutes)];
    };

    const getDurationParts = (totalSeconds) => {
      const safeSeconds = Math.max(0, Math.floor(totalSeconds));
      const hours = Math.floor(safeSeconds / 3600);
      const minutes = Math.floor((safeSeconds % 3600) / 60);
      const seconds = safeSeconds % 60;
      if (showSeconds.value) {
        return [pad2(hours), pad2(minutes), pad2(seconds)];
      }
      return [pad2(hours), pad2(minutes)];
    };

    const displayParts = computed(() => {
      if (mode.value === "clock") {
        return getTimeParts(now.value);
      }
      if (mode.value === "countdown") {
        return getDurationParts(countdownRemaining.value);
      }
      if (mode.value === "stopwatch") {
        return getDurationParts(stopwatchElapsed.value);
      }
      return getDurationParts(pomodoroRemaining.value);
    });

    const subLabel = computed(() => {
      if (mode.value !== "clock" || is24h.value) {
        return "";
      }
      return now.value.getHours() < 12 ? "AM" : "PM";
    });

    const saveSettings = () => {
      const payload = {
        showSeconds: showSeconds.value,
        is24h: is24h.value,
        countdownSeconds: countdownSeconds.value,
        pomodoroWorkSeconds: pomodoroWorkSeconds.value,
        pomodoroBreakSeconds: pomodoroBreakSeconds.value,
        clockScalePercent: clockScalePercent.value
      };
      try {
        localStorage.setItem("flipClockSettings", JSON.stringify(payload));
      } catch (error) {
        // Ignore storage errors (private mode, quota).
      }
    };

    const loadSettings = () => {
      try {
        const raw = localStorage.getItem("flipClockSettings");
        if (!raw) {
          return;
        }
        const payload = JSON.parse(raw);
        if (typeof payload.showSeconds === "boolean") {
          showSeconds.value = payload.showSeconds;
        }
        if (typeof payload.is24h === "boolean") {
          is24h.value = payload.is24h;
        }
        if (Number.isFinite(payload.countdownSeconds)) {
          countdownSeconds.value = Math.max(
            0,
            Math.floor(payload.countdownSeconds)
          );
        }
        if (Number.isFinite(payload.pomodoroWorkSeconds)) {
          pomodoroWorkSeconds.value = Math.max(
            60,
            Math.floor(payload.pomodoroWorkSeconds)
          );
        }
        if (Number.isFinite(payload.pomodoroBreakSeconds)) {
          pomodoroBreakSeconds.value = Math.max(
            60,
            Math.floor(payload.pomodoroBreakSeconds)
          );
        }
        if (Number.isFinite(payload.clockScalePercent)) {
          clockScalePercent.value = Math.min(
            100,
            Math.max(0, Math.floor(payload.clockScalePercent))
          );
        } else if (Number.isFinite(payload.clockScale)) {
          const percent = ((payload.clockScale - 0.6) / 0.5) * 100;
          clockScalePercent.value = Math.min(
            100,
            Math.max(0, Math.floor(percent))
          );
        }
      } catch (error) {
        // Ignore parse/storage errors.
      }
    };

    loadSettings();

    watch(countdownSeconds, (value) => {
      const safeValue = Math.max(0, Math.floor(value || 0));
      if (safeValue !== value) {
        countdownSeconds.value = safeValue;
      }
    });

    watch(
      [
        showSeconds,
        is24h,
        countdownSeconds,
        pomodoroWorkSeconds,
        pomodoroBreakSeconds,
        clockScalePercent
      ],
      saveSettings
    );

    let timerId = null;

    onMounted(() => {
      timerId = setInterval(() => {
        if (mode.value === "clock") {
          now.value = new Date();
          return;
        }
        if (mode.value === "countdown") {
          if (countdownRunning.value && countdownRemaining.value > 0) {
            countdownRemaining.value -= 1;
          }
          return;
        }
        if (mode.value === "stopwatch") {
          if (stopwatchRunning.value) {
            stopwatchElapsed.value += 1;
          }
          return;
        }
        if (!pomodoroRunning.value) {
          return;
        }
        if (pomodoroRemaining.value > 0) {
          pomodoroRemaining.value -= 1;
          return;
        }
        if (pomodoroPhase.value === "work") {
          pomodoroPhase.value = "break";
          pomodoroRemaining.value = pomodoroBreakSeconds.value;
        } else {
          pomodoroPhase.value = "work";
          pomodoroRemaining.value = pomodoroWorkSeconds.value;
        }
      }, 1000);
    });

    onBeforeUnmount(() => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    });

    const toggleSeconds = () => {
      showSeconds.value = !showSeconds.value;
    };

    const toggle24h = () => {
      is24h.value = !is24h.value;
    };

    const startCountdown = (totalSeconds) => {
      const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
      if (safeSeconds === 0) {
        return;
      }
      mode.value = "countdown";
      countdownSeconds.value = safeSeconds;
      countdownRemaining.value = safeSeconds;
      countdownRunning.value = true;
    };

    const pauseCountdown = () => {
      if (mode.value === "countdown") {
        countdownRunning.value = false;
      }
    };

    const resumeCountdown = () => {
      if (mode.value === "countdown" && countdownRemaining.value > 0) {
        countdownRunning.value = true;
      }
    };

    const stopCountdown = () => {
      mode.value = "clock";
      countdownRemaining.value = 0;
      countdownRunning.value = false;
      now.value = new Date();
    };

    const openCountdown = () => {
      mode.value = "countdown";
      countdownRemaining.value = 0;
      countdownRunning.value = false;
    };

    const exitCountdown = () => {
      mode.value = "clock";
      countdownRemaining.value = 0;
      countdownRunning.value = false;
      now.value = new Date();
    };

    const startPomodoro = (config) => {
      const workSeconds = Math.max(60, Math.floor(config.workSeconds || 0));
      const breakSeconds = Math.max(60, Math.floor(config.breakSeconds || 0));
      mode.value = "pomodoro";
      pomodoroPhase.value = "work";
      pomodoroWorkSeconds.value = workSeconds;
      pomodoroBreakSeconds.value = breakSeconds;
      pomodoroRemaining.value = workSeconds;
      pomodoroRunning.value = true;
    };

    const pausePomodoro = () => {
      if (mode.value === "pomodoro") {
        pomodoroRunning.value = false;
      }
    };

    const resumePomodoro = () => {
      if (mode.value === "pomodoro" && pomodoroRemaining.value > 0) {
        pomodoroRunning.value = true;
      }
    };

    const stopPomodoro = () => {
      mode.value = "clock";
      pomodoroRemaining.value = 0;
      pomodoroRunning.value = false;
      now.value = new Date();
    };

    const openPomodoro = () => {
      mode.value = "pomodoro";
      pomodoroRemaining.value = 0;
      pomodoroRunning.value = false;
    };

    const exitPomodoro = () => {
      mode.value = "clock";
      pomodoroRemaining.value = 0;
      pomodoroRunning.value = false;
      now.value = new Date();
    };

    const openStopwatch = () => {
      mode.value = "stopwatch";
      stopwatchRunning.value = false;
    };

    const startStopwatch = () => {
      mode.value = "stopwatch";
      stopwatchRunning.value = true;
    };

    const stopStopwatch = () => {
      stopwatchRunning.value = false;
    };

    const resetStopwatch = () => {
      stopwatchElapsed.value = 0;
      stopwatchRunning.value = false;
    };

    const exitStopwatch = () => {
      mode.value = "clock";
      stopwatchRunning.value = false;
      now.value = new Date();
    };

    const updateClockScale = (value) => {
      const safeValue = Math.min(100, Math.max(0, Math.floor(Number(value))));
      clockScalePercent.value = Number.isFinite(safeValue) ? safeValue : 80;
    };

    return {
      showSeconds,
      is24h,
      mode,
      now,
      countdownSeconds,
      countdownRemaining,
      countdownRunning,
      pomodoroPhase,
      pomodoroRemaining,
      pomodoroRunning,
      pomodoroWorkSeconds,
      pomodoroBreakSeconds,
      stopwatchElapsed,
      stopwatchRunning,
      clockScalePercent,
      clockScale,
      displayParts,
      subLabel,
      toggleSeconds,
      toggle24h,
      startCountdown,
      pauseCountdown,
      resumeCountdown,
      stopCountdown,
      openCountdown,
      exitCountdown,
      startPomodoro,
      pausePomodoro,
      resumePomodoro,
      stopPomodoro,
      openPomodoro,
      exitPomodoro,
      openStopwatch,
      startStopwatch,
      stopStopwatch,
      resetStopwatch,
      exitStopwatch,
      updateClockScale
    };
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #e6e6e6;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  flex-direction: column;
  padding: 24px 16px;
}

.clock {
  margin: 0;
}
</style>

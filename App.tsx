import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Flame,
  Camera,
  CameraOff,
  Copy,
  Check,
  Terminal,
  Volume2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Unlock,
  Lock,
  Download,
  TerminalSquare,
  Compass,
  HelpCircle,
  Eye,
  Sliders,
  UserX,
  UserCheck,
  ChevronRight,
  Info
} from "lucide-react";
import { AlertConfig, SecurityAssessment, DeviceSensorStats } from "./types";

export default function App() {
  // Config Parameter Hook States
  const [os, setOs] = useState<AlertConfig["os"]>("windows");
  const [reason, setReason] = useState<AlertConfig["reason"]>("package");
  const [customReason, setCustomReason] = useState("");
  const [awayTimeMinutes, setAwayTimeMinutes] = useState(15);
  const [environment, setEnvironment] = useState<AlertConfig["environment"]>("coffee_shop");
  const [unattendedBehavior, setUnattendedBehavior] = useState<AlertConfig["unattendedBehavior"]>("voice_siren");

  // Endpoint Trigger State Hooks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<SecurityAssessment | null>(null);

  // Simulated Device Sensor State Hooks
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [isUserPresent, setIsUserPresent] = useState(true);
  const [countdownSeconds, setCountdownSeconds] = useState(10); // Quick trigger demo loop
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [scriptCopied, setScriptCopied] = useState(false);

  // HTML5 audio generator node & speech synthesis references
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize browser parameters & dynamic welcome setup
  useEffect(() => {
    // Attempt automatic OS matching based on navigator statistics
    try {
      const platform = window.navigator.platform.toLowerCase();
      if (platform.includes("mac")) {
        setOs("macos");
      } else if (platform.includes("linux")) {
        setOs("linux");
      } else {
        setOs("windows");
      }
    } catch (e) {
      // safe fallback
    }

    // Default system logs initial stream setup
    setLogMessages([
      "SYSTEM: Cyber Shield active core initialised.",
      "SYSTEM: Physical presence scanner armed. Ready."
    ]);

    return () => {
      stopCamera();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (logTimerRef.current) clearTimeout(logTimerRef.current);
    };
  }, []);

  // Play synthetic WebAudio frequency alarm directly in-browser
  const triggerSyntheticSiren = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      // Sweep sound frequency for cybersecurity warning feeling
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.45);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.9);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.25);
    } catch (err) {
      console.warn("Audio Context playback prevented by safety/interaction policies:", err);
    }
  };

  // Speaks customized cyber alarms using native window speech synthesis
  const triggerVocalSpeak = (speakText: string) => {
    if (!speakText) return;
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // kill lingering voice queues
        const utterance = new SpeechSynthesisUtterance(speakText);
        utterance.rate = 0.95; // Slightly authoritative, synthetic pace
        utterance.pitch = 0.85; // Low deep baritone alarm tone
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech Synthesis synthesis failed:", e);
    }
  };

  // Start real webcam stream with overlay telemetry scanner
  const startCamera = async () => {
    try {
      stopCamera(); // Stop any legacy trace
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" }
      });
      streamRef.current = stream;
      setWebcamActive(true);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addLogLine("SENSOR: Camera stream mounted successfully. Presence scanner initialized.");
    } catch (err: any) {
      console.warn("Webcam access declined or not supported:", err);
      setHasCameraPermission(false);
      setWebcamActive(false);
      addLogLine("SENSOR: Camera permission block/unsupported. Mock presence analytics enabled.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  // Helper log emitter
  const addLogLine = (message: string) => {
    const timestamp = new Date().toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    setLogMessages(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 39)]);
  };

  // Trigger real AI Scan Assessment from backend endpoint
  const compileSecurityScan = async (triggerAlertImmediately = false) => {
    setLoading(true);
    setError(null);
    try {
      const payload: AlertConfig = {
        os,
        reason,
        customReason: customReason.trim() ? customReason.trim() : undefined,
        awayTimeMinutes,
        environment,
        unattendedBehavior
      };

      const response = await fetch("/api/assess-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || "Failed to analyze security posture.");
      }

      const assessmentResult: SecurityAssessment = await response.json();
      setAssessment(assessmentResult);
      addLogLine(`ANALYSIS REPORT: Posture Score calculated: ${assessmentResult.overallScore}/100. Threat Severity: ${assessmentResult.overallRiskGrade.toUpperCase()}`);

      if (triggerAlertImmediately) {
        executeAlertResponse(assessmentResult);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Secure endpoint communication disrupted.");
    } finally {
      setLoading(false);
    }
  };

  // Executing actions based on configuration payload
  const executeAlertResponse = (data: SecurityAssessment) => {
    setAlertTriggered(true);
    addLogLine(`ATTENTION TRIGGERED: Stepped away behavior alert activated. Style: ${unattendedBehavior.toUpperCase()}`);

    // Custom voice verbal alarm synthesis
    if (unattendedBehavior === "voice_siren" || unattendedBehavior === "simulated_payload") {
      triggerVocalSpeak(data.verbalWarningText);
    }

    // High frequency beep
    if (unattendedBehavior === "high_freq_alarm" || unattendedBehavior === "voice_siren") {
      triggerSyntheticSiren();
    }

    // Emulate hacker logs sequence scrolling
    if (unattendedBehavior === "simulated_payload" || unattendedBehavior === "discrete_alert") {
      // Stagger fake hacker outputs
      let idx = 0;
      const fakeHackerLines = data.simulatedIntrusionPayload.simulatedLogLines;
      const interval = setInterval(() => {
        if (idx < fakeHackerLines.length) {
          addLogLine(`[BREACH LOGGER]: ${fakeHackerLines[idx]}`);
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 700);
    }
  };

  // Manage Arming / Monitoring core cycle state
  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      // Disarm everything safely
      setIsMonitoring(false);
      setAlertTriggered(false);
      setIsUserPresent(true);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      stopCamera();
      addLogLine("SYSTEM: Surveillance guard disarmed. Workstation safe.");
    } else {
      // Arm Surveillance
      setIsMonitoring(true);
      setAlertTriggered(false);
      setIsUserPresent(true);
      setCountdownSeconds(10); // Reset countdown for demo alert speed
      addLogLine("SYSTEM: Surveillance armed. Guarding locks against stepping away.");
      await startCamera();
      
      // Auto-compile AI report in the background to avoid latency
      compileSecurityScan(false);
    }
  };

  // Simulate remote employee stepping away scenario trigger (Meal, Package, Exercise)
  const handleUserSteppedAway = () => {
    if (!isMonitoring) {
      addLogLine("SYSTEM ALERT: Arm physical shield monitoring scanner first before stepping out.");
      return;
    }
    setIsUserPresent(false);
    addLogLine(`SENSOR: Motion change detected. Host stepped away for context [${reason.toUpperCase()}]. Waiting for presence verify checks.`);

    // Start fast countdown to trigger alert mock
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    let secondsLeft = 8;
    setCountdownSeconds(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft--;
      setCountdownSeconds(secondsLeft);
      if (secondsLeft % 2 === 0) {
        addLogLine(`SENSOR COMPROMISE ALERT: Host absence confirmed. Critical lockout in ${secondsLeft}s.`);
        triggerSyntheticSiren();
      }

      if (secondsLeft <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        // Trigger actual alert sequence with AI compiled context
        if (assessment) {
          executeAlertResponse(assessment);
        } else {
          // If compile scan is not completed yet, run & alert
          compileSecurityScan(true);
        }
      }
    }, 1000);
  };

  // Simulate returning back safely
  const handleUserReturned = () => {
    setIsUserPresent(true);
    setAlertTriggered(false);
    setCountdownSeconds(10);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    addLogLine("SENSOR: Host presence verified. Session returned back to active secure state.");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // Handles copying locks command script
  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
    });
  };

  // Retrieve matching UI colors for risk grades
  const getRiskSeverityColor = (grade?: 'Critical' | 'High' | 'Medium' | 'Low') => {
    if (!grade) return "text-slate-400 border-slate-200 bg-slate-50";
    switch (grade) {
      case "Critical": return "text-rose-600 border-rose-200 bg-rose-50";
      case "High": return "text-orange-600 border-orange-200 bg-orange-50";
      case "Medium": return "text-amber-600 border-amber-200 bg-amber-50";
      case "Low": return "text-emerald-600 border-emerald-200 bg-emerald-50";
    }
  };

  // Static Activity presets mapper for icons
  const getActivityLabel = (r: AlertConfig["reason"]) => {
    switch (r) {
      case "package": return "Collect Package Delivery";
      case "meal_prep": return "Kitchen Meal Prep Setup";
      case "exercise": return "Workout / Going for Exercise";
      case "quick_break": return "Quick Restroom/Coffee Break";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-150 font-sans selection:bg-indigo-900 selection:text-indigo-200">
      
      {/* Dynamic Cyber Security HUD Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
            <Shield className="w-5.5 h-5.5 animate-pulse" id="shield-head" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-sans font-black text-lg text-white tracking-tight">The Screen Off Alert</h1>
              <span className="text-[9px] bg-red-950/60 border border-red-800 text-red-400 font-bold tracking-widest uppercase px-2 py-0.5 rounded-full leading-none">
                C2 Cyber Unit
              </span>
            </div>
            <p className="font-mono text-[9px] text-slate-400 tracking-wider mt-0.5 uppercase">
              Physical Endpoint Defense & Machine Lock neglect Guard
            </p>
          </div>
        </div>

        {/* Global Arm Surveillance Control Panel Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${isMonitoring ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
            <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase font-black">
              SECURE WATCHDOG: {isMonitoring ? "ENGAGED" : "OFFLINE"}
            </span>
          </div>

          <button
            onClick={handleToggleMonitoring}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center space-x-1.5 uppercase tracking-wide border ${
              isMonitoring
                ? "bg-red-600 border-red-500 hover:bg-red-500 text-white shadow-lg shadow-red-950/50"
                : "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-950/20"
            }`}
            id="arm-sentinel-btn"
          >
            {isMonitoring ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Disarm Watchdog</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Arm Watchdog</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* Onboarding Cyber Warning Callout */}
        <div className="bg-slate-950 border border-indigo-950/80 p-5 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-start space-x-3 text-left">
            <div className="w-10 h-10 bg-indigo-950/80 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-900">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Employee Safety Briefing</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-0.5">
                Stepping away from laptops unlock states to collect packages, prepare fast meals, or take exercises is one of the highest contributors to physical corporate exfil, network token theft, and badUSB payload breaches. Guard your physical session dynamically below!
              </p>
            </div>
          </div>
          <div className="text-xs bg-indigo-950/50 border border-indigo-800 text-indigo-300 text-left rounded-xl p-3 max-w-xs shrink-0 font-mono">
            <span className="font-bold block text-[10px] uppercase text-indigo-200 mb-1">⚡ Dynamic Cybersecurity Skills:</span>
            Physical vulnerability evaluation, machine auto-locking automation scripts generation, and live Presence Telemetry simulation.
          </div>
        </div>

        {/* Layout Command workspace grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Parametric Configuration (OS, Duration, Settings) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Guard Parameter</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">PARAM.01</span>
              </div>

              {/* Host OS Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Target Operating System
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["windows", "macos", "linux"] as const).map((osType) => (
                    <button
                      key={osType}
                      type="button"
                      onClick={() => {
                        setOs(osType);
                        addLogLine(`CONFIG: Target Operating System set to [${osType.toUpperCase()}].`);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold capitalize transition-all border ${
                        os === osType
                          ? "bg-indigo-950/80 text-indigo-400 border-indigo-500/50 shadow-inner"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
                      }`}
                    >
                      {osType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Neglect Stepped-Away Reason */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Activity Context (Leaving to...)
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    const val = e.target.value as AlertConfig["reason"];
                    setReason(val);
                    addLogLine(`CONFIG: Stepped away target context changed to [${val.toUpperCase()}].`);
                  }}
                  className="w-full text-xs bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 focus:border-indigo-500 text-slate-200 outline-none"
                  id="activity-dropdown"
                >
                  <option value="package">📦 Collect Package Delivery</option>
                  <option value="meal_prep">🍳 Kitchen Meal Preparations</option>
                  <option value="exercise">🏃 Going out for Exercises</option>
                  <option value="quick_break">☕ Coffee / Quick Restroom Run</option>
                </select>
              </div>

              {/* Custom Reason Context */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Specify details / tasks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fedex delivery checkout or preheating electric pan"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full text-xs bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-slate-250 outline-none focus:border-indigo-500 transition-all"
                  id="custom-details"
                />
              </div>

              {/* Estimated Unattended Away Time Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="uppercase tracking-widest font-bold">Planned Away Duration</span>
                  <span className="text-white font-black bg-slate-900 px-2 py-0.5 border border-slate-800 rounded">
                    {awayTimeMinutes} Min
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={awayTimeMinutes}
                  onChange={(e) => setAwayTimeMinutes(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] font-mono text-slate-500">
                  <span>1 Minute (Quick Task)</span>
                  <span>2 Hours</span>
                </div>
              </div>

              {/* Physical Threat Environment */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Physical Setting Vulnerability
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["home", "coworking", "coffee_shop", "corporate_office"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => {
                        setEnvironment(env);
                        addLogLine(`CONFIG: Threat landscape environment set to [${env.toUpperCase()}].`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        environment === env
                          ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-400"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold block capitalize">{env.replace("_", " ")}</span>
                      <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">
                        {env === "home" && "Guests, kids, pet access"}
                        {env === "coworking" && "Semi-public workspace"}
                        {env === "coffee_shop" && "Extremely high risk"}
                        {env === "corporate_office" && "Co-worker audits"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Neglect Unattended Behavioral Triggers */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Defensive Alarm Trigger Style
                </label>
                <div className="space-y-2">
                  {[
                    { key: "voice_siren", label: "🗣️ Voice siren warnings", desc: "Plays authorities voice + synthesizer beep warnings out loud." },
                    { key: "discrete_alert", label: "🤫 Invisible lock monitor", desc: "Silently scans presence threat indices." },
                    { key: "high_freq_alarm", label: "🚨 High Frequency Alarm tone", desc: "A constant cyber beep warning loop." },
                    { key: "simulated_payload", label: "👾 Simulated hack breach payload", desc: "Launches visual hacker script executions so you learn lessons!" }
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => {
                        const style = item.key as AlertConfig["unattendedBehavior"];
                        setUnattendedBehavior(style);
                        addLogLine(`CONFIG: Warning alert style mapped to [${style.toUpperCase()}].`);
                      }}
                      className={`flex items-start text-left space-x-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                        unattendedBehavior === item.key
                          ? "bg-indigo-950/50 border-indigo-500/30 text-indigo-200"
                          : "bg-slate-900/50 hover:bg-slate-800/50 border-slate-800 text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={unattendedBehavior === item.key}
                        readOnly
                        className="mt-1 accent-indigo-500 focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold block">{item.label}</span>
                        <span className="text-[9px] text-slate-500 leading-none">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Endpoint Evaluation Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => compileSecurityScan(false)}
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-md active:scale-98 disabled:opacity-50"
                  id="evaluate-posture-btn"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning threats...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-1">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Assess Risk Posture</span>
                    </span>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Security Terminal Scanner HUD */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* The Main Interactive Sensor Monitor Device Chassis */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
              
              {/* Header inside HUD */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-indigo-950 pb-3.5 mb-5 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Terminal className="w-4.5 h-4.5 text-indigo-400" />
                    <span>WORKSTATION SECURE SHIELD SCANNER</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    SENSOR RESOLUTION: 320x240p • ALVEARY SYSTEM INTERACTIVE LAB
                  </p>
                </div>
                
                {isMonitoring && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded uppercase anim-pulse">
                      ACTIVE SURVEYS
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdownSeconds}s Countdown</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Twin layout inside chassis: Visual stream Mock / Real feed + system logs output */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Visual camera radar scanner box */}
                <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden text-center group">
                  
                  {/* Visual telemetry overlays */}
                  <div className="absolute inset-x-0 top-3 px-3 flex justify-between items-center text-[8px] font-mono text-slate-500 z-10">
                    <span>INDEX_MODE: TELEMETRY</span>
                    <span className="flex items-center text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isUserPresent ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                      {isUserPresent ? "USER PRESENCE OK" : "LOCKOUT TIMING TRIP"}
                    </span>
                  </div>

                  <div className="absolute inset-0 border border-indigo-500/5 pointer-events-none rounded-2xl" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-indigo-500/5 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 h-px bg-indigo-500/5 pointer-events-none" />

                  {/* Active monitoring grid state */}
                  {isMonitoring ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {/* Active video element if webcam is active */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-44 rounded-xl object-cover border border-indigo-500/20 bg-black ${!webcamActive && 'hidden'}`}
                      />

                      {/* Fallback clean motion scanning radar vector */}
                      {!webcamActive && (
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="relative w-24 h-24 mb-3">
                            {/* Spinning sweep grid circles */}
                            <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/30 animate-spin" style={{ animationDuration: "12s" }} />
                            <div className="absolute inset-2 rounded-full border border-indigo-500/10" />
                            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500/50 animate-spin" />
                            <div className="absolute inset-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-indigo-400 stroke-1" />
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest mt-2 block animate-pulse">
                            Armed presence radar
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono mt-1">Webcam blocked. Active mock monitoring active.</span>
                        </div>
                      )}

                      {/* Trigger Actions for Simulation step away tests */}
                      <div className="mt-4 flex flex-wrap gap-2 w-full justify-center">
                        {isUserPresent ? (
                          <button
                            type="button"
                            onClick={handleUserSteppedAway}
                            className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/35 border border-red-500/50 hover:border-red-500 text-red-200 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center space-x-1 uppercase"
                            id="simulate-stepped-away-btn"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Away to {reason.replace("_", " ")}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleUserReturned}
                            className="px-4 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500 text-emerald-100 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center space-x-1 uppercase shadow-md shadow-emerald-950/40"
                            id="simulate-returned-btn"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Verify: I am Back!</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Default idle screen config
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 bg-slate-800/60 rounded-full border border-slate-700/60 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
                        <CameraOff className="w-6 h-6 stroke-1" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">Surveillance Watchdog Idle</span>
                        <span className="text-[10px] text-slate-500 max-w-xs block mx-auto leading-relaxed mt-1 px-4">
                          To run simulation with automatic alarms, click the <strong className="text-indigo-400 font-bold font-mono">"Arm Watchdog"</strong> controls header.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Laser alarm grid swipe animation when stepped away */}
                  {!isUserPresent && isMonitoring && (
                    <div className="absolute inset-x-0 h-1 bg-red-500 shadow-lg shadow-red-500/50 animate-bounce top-1/4" />
                  )}
                </div>

                {/* Cyber Logs Real-time Diagnostic Screen */}
                <div className="md:col-span-6 flex flex-col bg-slate-950/90 border border-slate-900 rounded-2xl font-mono text-[10px] text-slate-400 overflow-hidden leading-tight p-3">
                  <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-indigo-950/40 pb-2 mb-2">
                    <span>SECURITY CONSOLE LOG</span>
                    <span>TIE.FEED_V1</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[190px] space-y-1.5 pr-1 flex flex-col-reverse justify-end font-mono">
                    {logMessages.map((log, index) => {
                      let textColor = "text-slate-400";
                      if (log.includes("SYSTEM:")) textColor = "text-indigo-400 font-bold";
                      if (log.includes("ALERT") || log.includes("ATTENTION") || log.includes("BREACH")) textColor = "text-rose-400 font-black animate-pulse";
                      if (log.includes("SENSOR:")) textColor = "text-amber-400";
                      if (log.includes("ANALYSIS REPORT:")) textColor = "text-emerald-400 font-bold";
                      
                      return (
                        <div key={index} className={`border-l-2 pl-2 border-indigo-950/85 ${textColor}`}>
                          {log}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-indigo-950/40 mt-2 flex justify-between text-[8px] text-slate-500">
                    <span>AUTOSAVE STATE: ACTIVE</span>
                    <span>SESSION: SECURED</span>
                  </div>
                </div>

              </div>

              {/* Siren banner overlay alert state */}
              <AnimatePresence>
                {alertTriggered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center p-6 text-center z-30 space-y-4"
                  >
                    <div className="w-16 h-16 bg-red-900/40 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 animate-bounce">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-rose-500 tracking-widest uppercase">
                        SESSION REVEALED INTRU ALERT!
                      </h3>
                      <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed mt-1">
                        Laptop neglect scan tripped while stepping away to <strong className="text-white capitalize">{reason.replace("_", " ")}</strong> at a <strong className="text-white capitalize">{environment.replace("_", " ")}</strong>!
                      </p>
                    </div>

                    <div className="bg-slate-900/85 p-3.5 border border-red-900/40 rounded-xl max-w-md text-left font-mono">
                      <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase block mb-1">AUDIBLE VOICE ALARM SAYING:</span>
                      <p className="text-xs text-red-100 font-medium">"{assessment?.verbalWarningText || `Alert! Unsecure session left open for ${reason}. Please lock workstation.`}"</p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleUserReturned}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold tracking-widest uppercase"
                      >
                        Deactivate Alarms (I am back)
                      </button>
                      
                      {assessment?.simulatedIntrusionPayload && unattendedBehavior === "simulated_payload" && (
                        <button
                          type="button"
                          onClick={() => {
                            setAlertTriggered(false);
                            addLogLine("SYSTEM: Switched off simulation. Reviewing custom lock-down recommendations below!");
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono"
                        >
                          View Logs
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* AI Posture vulnerability assessment scorecard & metrics */}
            <AnimatePresence>
              {assessment && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-left"
                  id="vulnerability-scan-results"
                >
                  
                  {/* Score & probabilities panel */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${getRiskSeverityColor(assessment.overallRiskGrade)}`}>
                            {assessment.overallRiskGrade} Posture Risk Category
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-100 tracking-tight mt-1">Host Behavior Vulnerability Audit</h4>
                      </div>

                      <div className="mt-2 sm:mt-0 bg-slate-900 px-4 py-1.5 border border-slate-800 rounded-xl flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-mono">Endpoint Posture Rating:</span>
                        <span className="text-xl font-black text-indigo-400 font-mono">{assessment.overallScore}/100</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Meter 1: Exfiltration */}
                      <div className="bg-slate-900/50 p-4 border border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Session Exfil Probability</span>
                        <div className="flex justify-between items-end">
                          <span className="text-2xl font-black font-mono text-slate-100">{assessment.physicalDataBreachProbability}%</span>
                          <span className="text-[9px] text-slate-400">Physical vectors</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${assessment.physicalDataBreachProbability}%` }} />
                        </div>
                      </div>

                      {/* Meter 2: Shoulder Surfing */}
                      <div className="bg-slate-900/50 p-4 border border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Shoulder Peeping / Surfing</span>
                        <div className="flex justify-between items-end">
                          <span className="text-2xl font-black font-mono text-slate-100">{assessment.shoulderSurfingRisk}%</span>
                          <span className="text-[9px] text-slate-400">Passive viewing</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${assessment.shoulderSurfingRisk}%` }} />
                        </div>
                      </div>

                      {/* Meter 3: Keyboard injectors */}
                      <div className="bg-slate-900/50 p-4 border border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Keystore/USB Inject Opportunity</span>
                        <div className="flex justify-between items-end">
                          <span className="text-2xl font-black font-mono text-slate-100">{assessment.maliciousActorInjectionOpportunity}%</span>
                          <span className="text-[9px] text-slate-400">USB payload threat</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full rounded-full" style={{ width: `${assessment.maliciousActorInjectionOpportunity}%` }} />
                        </div>
                      </div>

                    </div>

                    {/* Threat description */}
                    <div className="bg-indigo-950/20 border border-indigo-900/20 p-4 rounded-2xl">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block mb-1">
                        Defensive Penetration Briefing
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {assessment.riskRationale}
                      </p>
                    </div>

                  </div>

                  {/* Operational Locking Script specific to OS */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TerminalSquare className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-widest leading-none">
                          Tactical Locking Automation Tool ({os.toUpperCase()})
                        </h4>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">AUTOMATE.SH</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Cybersecurity involves building automated defense boundaries. Run the verified locking snippet below in your terminal/powershell to arm instant physical locking:
                      </p>

                      <div className="bg-slate-900 rounded-2xl border border-slate-850 p-4 font-mono text-xs text-indigo-300 relative group overflow-x-auto select-all">
                        <button
                          onClick={() => handleCopyScript(assessment.osLockInstructions.command)}
                          className="absolute right-3 top-3 p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800"
                          title="Copy command"
                        >
                          {scriptCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <pre className="pr-12 text-left leading-normal whitespace-pre">
                          <code>{assessment.osLockInstructions.command}</code>
                        </pre>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                        <div className="sm:col-span-8 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">Configuration Deployment instructions:</span>
                          <p className="text-xs text-slate-350 leading-relaxed">{assessment.osLockInstructions.howToApply}</p>
                        </div>

                        <div className="sm:col-span-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">Tactile physical shortcut:</span>
                          <span className="text-sm font-extrabold text-white text-center font-mono py-1 block bg-slate-950/80 rounded border border-slate-800 border-dashed mt-1">
                            {assessment.osLockInstructions.shortcutKeys}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Physical hardening checklist of recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Hardening guidelines */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
                      <div className="flex items-center space-x-2 border-b border-indigo-950 pb-2.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-250">
                          Operational Physical Hygiene Map
                        </h5>
                      </div>
                      <ul className="space-y-2.5">
                        {assessment.defenseHardeningTips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2.5 leading-relaxed">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Threat Attack Log Simulation */}
                    <div className="bg-slate-950 border border-slate-850 rounded-3xl p-5 shadow-2xl space-y-3 font-mono">
                      <div className="flex items-center space-x-2 border-b border-indigo-950 pb-2.5 justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                            Simulated Adversary Breach Logs
                          </h5>
                        </div>
                        <span className="text-[8px] bg-red-950/60 text-red-400 border border-red-900 px-1.5 py-0.2 rounded font-black">
                          {unattendedBehavior === "discrete_alert" ? "MONITORING_DEMO" : "PAYLOAD_ACTIVE"}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-[10px] text-slate-400">
                        <div className="flex justify-between border-b border-indigo-950/20 pb-1.5 mb-1.5 font-mono">
                          <span>THREAT_ACTOR: <strong className="text-white font-bold">{assessment.simulatedIntrusionPayload.attackerName}</strong></span>
                          <span>VECTOR: <strong className="text-amber-400 font-bold">{assessment.simulatedIntrusionPayload.payloadDemoName}</strong></span>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-850/80 p-3 rounded-xl max-h-[120px] overflow-y-auto space-y-1 leading-normal text-left font-mono">
                          {assessment.simulatedIntrusionPayload.simulatedLogLines.map((line, lidx) => (
                            <div key={lidx} className="text-slate-350 border-l border-slate-800 pl-1.5 py-0.5">
                              {line.startsWith("[") ? line : `> ${line}`}
                            </div>
                          ))}
                        </div>
                        <span className="text-[8px] text-slate-500 pt-1.5 block text-center uppercase tracking-wide">
                          ALERT: Locking screen immediately prevents the execution path shown above.
                        </span>
                      </div>
                    </div>

                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </main>

      {/* Cyber Guard Ambient Overlay Footer */}
      <footer className="mt-16 text-center border-t border-slate-800 pt-8 max-w-7xl mx-auto px-4 text-slate-550 font-mono text-[10px] uppercase tracking-widest">
        <span>The Screen Off Alert Terminal Engine • Zero-Trust Presence Defense V1.3</span>
      </footer>

    </div>
  );
}

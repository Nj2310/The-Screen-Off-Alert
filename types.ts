export interface AlertConfig {
  os: 'windows' | 'macos' | 'linux';
  reason: 'package' | 'meal_prep' | 'exercise' | 'quick_break';
  customReason?: string;
  awayTimeMinutes: number;
  environment: 'home' | 'coworking' | 'coffee_shop' | 'corporate_office';
  unattendedBehavior: 'voice_siren' | 'discrete_alert' | 'high_freq_alarm' | 'simulated_payload';
}

export interface MetricRating {
  name: string;
  score: number; // 0 to 10
  color: string;
}

export interface SecurityAssessment {
  overallRiskGrade: 'Critical' | 'High' | 'Medium' | 'Low';
  overallScore: number; // 0 to 100, where higher is more secure
  physicalDataBreachProbability: number; // percentage
  shoulderSurfingRisk: number; // percentage
  maliciousActorInjectionOpportunity: number; // percentage
  riskRationale: string;
  defenseHardeningTips: string[];
  osLockInstructions: {
    command: string;
    howToApply: string;
    shortcutKeys: string;
  };
  simulatedIntrusionPayload: {
    attackerName: string;
    payloadDemoName: string;
    simulatedLogLines: string[];
  };
  verbalWarningText: string;
}

export interface DeviceSensorStats {
  cameraActive: boolean;
  eyesDetected: boolean;
  unattendedSeconds: number;
  isTriggered: boolean;
}

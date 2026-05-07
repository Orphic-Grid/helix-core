from datetime import datetime
from typing import Literal
from dataclasses import dataclass

from fastapi import FastAPI
from pydantic import BaseModel


class Medication(BaseModel):
    drug_name: str
    dosage: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    frequency: str | None = None
    adherence_score: float | None = None


class MedicalEvent(BaseModel):
    type: str
    title: str
    description: str
    event_date: datetime | None = None
    severity: str | None = None


class Vital(BaseModel):
    type: str
    value: str
    recorded_at: datetime | None = None


class BloodTest(BaseModel):
    test_name: str
    test_value: float | None = None
    unit: str | None = None
    is_abnormal: bool | None = None
    severity: str | None = None
    test_date: datetime | None = None
    risk_indicator: str | None = None


class XrayReport(BaseModel):
    report_type: str
    body_part: str
    findings: str
    urgency: str | None = None
    risk_score: float | None = None


class PatientPayload(BaseModel):
    id: str
    govt_id: str
    age: int
    gender: str
    chronic_conditions: list[str] = []
    medications: list[Medication] = []
    events: list[MedicalEvent] = []
    vitals: list[Vital] = []
    blood_tests: list[BloodTest] = []
    xray_reports: list[XrayReport] = []


class Alert(BaseModel):
    severity: Literal["critical", "warning", "stable"]
    title: str
    message: str
    source: str
    risk_score: float = 0.0
    recommendation: str | None = None


app = FastAPI(title="Helix Core Intelligence", version="2.0.0")

# Drug interaction database
BLOOD_THINNERS = {"warfarin", "heparin", "apixaban", "rivaroxaban", "dabigatran", "aspirin", "clopidogrel"}
NSAIDS = {"ibuprofen", "naproxen", "aspirin", "indomethacin", "diclofenac", "ketorolac"}
DIABETIC_MEDS = {"metformin", "glipizide", "glyburide", "pioglitazone", "sitagliptin", "insulin"}

# Dosage safety thresholds
DOSAGE_THRESHOLDS = {
    "metformin": {"max_daily": 2500, "unit": "mg"},
    "warfarin": {"max_daily": 15, "unit": "mg"},
    "amlodipine": {"max_daily": 10, "unit": "mg"},
    "lisinopril": {"max_daily": 80, "unit": "mg"},
    "ibuprofen": {"max_daily": 3200, "unit": "mg"},
}

DRUG_CONFLICTS = {
    frozenset({"warfarin", "aspirin"}): {
        "message": "Warfarin and aspirin significantly increase bleeding risk.",
        "severity": "critical",
        "action": "Monitor INR closely. Consider alternative antiplatelet agent."
    },
    frozenset({"warfarin", "ibuprofen"}): {
        "message": "Warfarin and ibuprofen can increase bleeding risk.",
        "severity": "critical",
        "action": "Use acetaminophen instead. Avoid NSAIDs with warfarin."
    },
    frozenset({"metformin", "contrast dye"}): {
        "message": "Metformin and contrast dye require renal safety review.",
        "severity": "warning",
        "action": "Hold metformin 48 hours before and after contrast imaging."
    },
    frozenset({"warfarin", "naproxen"}): {
        "message": "NSAIDs with warfarin increase bleeding risk.",
        "severity": "critical",
        "action": "Avoid NSAIDs. Use acetaminophen for pain relief."
    },
}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "2.0.0"}


@app.post("/alerts", response_model=list[Alert])
def generate_alerts(patient: PatientPayload) -> list[Alert]:
    """Enhanced alert generation with dosage analysis and comprehensive risk assessment."""
    alerts: list[Alert] = []
    
    # Create medication dictionary for quick lookup
    meds = {med.drug_name.strip().lower(): med for med in patient.medications if not med.end_date}
    med_names = {med.drug_name.strip().lower() for med in patient.medications if not med.end_date}
    
    # 1. Analyze vital signs
    _analyze_vitals(patient, alerts)
    
    # 2. Analyze blood tests with risk indicators
    _analyze_blood_tests(patient, alerts)
    
    # 3. Analyze medication dosages
    _analyze_dosages(patient.medications, alerts, patient.age)
    
    # 4. Detect drug-drug interactions
    _analyze_drug_interactions(med_names, meds, alerts)
    
    # 5. Analyze medication adherence
    _analyze_adherence(patient.medications, alerts)
    
    # 6. Check bleeding risk (medication + trauma)
    _analyze_bleeding_risk(patient, med_names, alerts)
    
    # 7. Check polypharmacy issues
    _analyze_polypharmacy(patient, meds, alerts)
    
    # 8. Age-related risk assessment
    _analyze_age_risks(patient, alerts)
    
    # 9. Analyze imaging findings
    _analyze_imaging(patient, alerts)
    
    # 10. Analyze disease progression
    _analyze_disease_progression(patient, alerts)
    
    # If no alerts, add stable status
    if not alerts:
        alerts.append(Alert(
            severity="stable",
            title="No immediate risks detected",
            message="Current health records indicate stable condition with no triggered risk rules.",
            source="Rules engine",
            risk_score=0.1,
        ))
    
    # Sort alerts by risk score
    alerts.sort(key=lambda a: a.risk_score, reverse=True)
    return alerts


def _analyze_vitals(patient: PatientPayload, alerts: list[Alert]) -> None:
    """Analyze vital signs for abnormalities."""
    for vital in patient.vitals:
        if vital.type.lower() == "bp":
            bp = parse_bp(vital.value)
            if not bp:
                continue
            systolic, diastolic = bp
            if systolic >= 180 or diastolic >= 120:
                alerts.append(Alert(
                    severity="critical",
                    title="Hypertensive Crisis",
                    message=f"Critical BP {systolic}/{diastolic} requires immediate attention.",
                    source="Vitals",
                    risk_score=0.95,
                    recommendation="Immediate clinical review needed. Consider hospital admission."
                ))
            elif systolic >= 160 or diastolic >= 100:
                alerts.append(Alert(
                    severity="critical",
                    title="Hypertension - Stage 2",
                    message=f"BP {systolic}/{diastolic} is critical. Urgent medication review needed.",
                    source="Vitals",
                    risk_score=0.85,
                    recommendation="Increase antihypertensive therapy. Consider additional agent."
                ))
                break
            elif systolic >= 140 or diastolic >= 90:
                alerts.append(Alert(
                    severity="warning",
                    title="Elevated Blood Pressure",
                    message=f"BP {systolic}/{diastolic} is above recommended range.",
                    source="Vitals",
                    risk_score=0.55,
                    recommendation="Monitor closely. Review medication compliance."
                ))
                break
        
        elif vital.type.lower() == "glucose":
            glucose = numeric(vital.value)
            if glucose >= 400:
                alerts.append(Alert(
                    severity="critical",
                    title="Severe Hyperglycemia",
                    message=f"Glucose {glucose} mg/dL indicates emergency hyperglycemia.",
                    source="Vitals",
                    risk_score=0.90,
                    recommendation="Immediate hospital referral. Risk of DKA."
                ))
            elif glucose >= 300:
                alerts.append(Alert(
                    severity="critical",
                    title="Critical Hyperglycemia",
                    message=f"Glucose {glucose} mg/dL requires urgent intervention.",
                    source="Vitals",
                    risk_score=0.80,
                    recommendation="Increase insulin dosage. Monitor for DKA."
                ))
            elif glucose < 70:
                alerts.append(Alert(
                    severity="critical",
                    title="Hypoglycemia Alert",
                    message=f"Glucose {glucose} mg/dL is dangerously low.",
                    source="Vitals",
                    risk_score=0.88,
                    recommendation="Immediate glucose administration needed."
                ))


def _analyze_blood_tests(patient: PatientPayload, alerts: list[Alert]) -> None:
    """Analyze blood test results for abnormalities and risks."""
    for test in patient.blood_tests:
        if test.is_abnormal and test.severity in ["moderate", "severe"]:
            score = 0.70 if test.severity == "moderate" else 0.85
            alerts.append(Alert(
                severity="critical" if test.severity == "severe" else "warning",
                title=f"{test.test_name}: {test.severity.upper()} Abnormality",
                message=f"{test.test_name} at {test.test_value} {test.unit} is abnormal. {test.lab_comments or ''}",
                source="Blood Tests",
                risk_score=score,
                recommendation=f"Risk Indicator: {test.risk_indicator or 'Requires clinical review'}"
            ))


def _analyze_dosages(medications: list[Medication], alerts: list[Alert], patient_age: int) -> None:
    """Analyze medication dosages for safety risks."""
    for med in medications:
        if not med.dosage or med.end_date:
            continue
        
        drug_name = med.drug_name.strip().lower()
        if drug_name not in DOSAGE_THRESHOLDS:
            continue
        
        threshold = DOSAGE_THRESHOLDS[drug_name]
        try:
            dosage_value = extract_numeric(med.dosage)
            if dosage_value is None:
                continue
            
            # Calculate frequency multiplier
            freq_multiplier = get_frequency_multiplier(med.frequency or "once daily")
            daily_dose = dosage_value * freq_multiplier
            max_daily = threshold["max_daily"]
            
            if daily_dose > max_daily * 1.2:  # 20% over limit
                alerts.append(Alert(
                    severity="critical",
                    title=f"DOSAGE ALERT: {med.drug_name} Overdosing",
                    message=f"Daily dose of {daily_dose} {threshold['unit']} exceeds safe limit of {max_daily} {threshold['unit']}.",
                    source="Medications",
                    risk_score=0.82,
                    recommendation=f"Reduce {med.drug_name} dosage or adjust frequency immediately."
                ))
            elif daily_dose > max_daily:
                alerts.append(Alert(
                    severity="warning",
                    title=f"Dosage Review: {med.drug_name}",
                    message=f"Daily dose of {daily_dose} {threshold['unit']} approaches or exceeds recommended maximum.",
                    source="Medications",
                    risk_score=0.60,
                    recommendation=f"Review {med.drug_name} dosage with prescribing physician."
                ))
            
            # Check for age-related dosing concerns
            if patient_age > 65 and drug_name in ["warfarin", "amlodipine", "lisinopril"]:
                if daily_dose > max_daily * 0.75:
                    alerts.append(Alert(
                        severity="warning",
                        title=f"Age-Related Dosage Concern: {med.drug_name}",
                        message=f"Patient age {patient_age} on {med.drug_name} at {med.dosage}. Elderly may require lower dosing.",
                        source="Medications",
                        risk_score=0.50,
                        recommendation=f"Consider dose reduction in elderly patient."
                    ))
        except (ValueError, TypeError):
            pass


def _analyze_drug_interactions(med_names: set[str], meds: dict, alerts: list[Alert]) -> None:
    """Detect dangerous drug-drug interactions."""
    for pair, conflict_info in DRUG_CONFLICTS.items():
        if pair.issubset(med_names):
            severity_map = {"critical": "critical", "warning": "warning"}
            alerts.append(Alert(
                severity=severity_map.get(conflict_info["severity"], "warning"),
                title=f"Drug Interaction: {' + '.join(pair)}",
                message=conflict_info["message"],
                source="Medications",
                risk_score=0.75 if conflict_info["severity"] == "critical" else 0.60,
                recommendation=conflict_info["action"]
            ))


def _analyze_adherence(medications: list[Medication], alerts: list[Alert]) -> None:
    """Check medication adherence patterns."""
    low_adherence = [m for m in medications if m.adherence_score and m.adherence_score < 0.75 and not m.end_date]
    if low_adherence:
        for med in low_adherence:
            alerts.append(Alert(
                severity="warning",
                title=f"Medication Adherence Issue: {med.drug_name}",
                message=f"Adherence score {med.adherence_score:.0%} indicates potential non-compliance with {med.drug_name}.",
                source="Medications",
                risk_score=0.55,
                recommendation="Patient counseling on medication importance and possible side effect management needed."
            ))


def _analyze_bleeding_risk(patient: PatientPayload, med_names: set[str], alerts: list[Alert]) -> None:
    """Check for bleeding risks with anticoagulants."""
    has_blood_thinner = bool(med_names.intersection(BLOOD_THINNERS))
    has_trauma = any(event.type in {"accident", "surgery"} or "trauma" in event.description.lower() 
                     for event in patient.events)
    has_fall = any("fall" in event.description.lower() for event in patient.events)
    
    if has_blood_thinner and (has_trauma or has_fall):
        alerts.append(Alert(
            severity="critical",
            title="Bleeding Risk: Anticoagulation + Trauma/Fall",
            message="Patient on anticoagulant therapy with recent trauma or fall history significantly increases bleeding risk.",
            source="Medication + Events",
            risk_score=0.88,
            recommendation="Monitor for signs of bleeding. Consider imaging if symptomatic. Evaluate need for anticoagulation."
        ))


def _analyze_polypharmacy(patient: PatientPayload, meds: dict, alerts: list[Alert]) -> None:
    """Check for polypharmacy issues."""
    active_meds = [m for m in patient.medications if not m.end_date]
    if len(active_meds) >= 5:
        complexity = len(active_meds)
        severity = "critical" if complexity >= 10 else "warning"
        score = 0.70 if complexity >= 10 else 0.50
        alerts.append(Alert(
            severity=severity,
            title=f"Polypharmacy Concern: {complexity} Active Medications",
            message=f"Patient on {complexity} concurrent medications increasing risk of drug interactions and non-compliance.",
            source="Medications",
            risk_score=score,
            recommendation="Medication review recommended. Consider deprescribing non-essential agents."
        ))


def _analyze_age_risks(patient: PatientPayload, alerts: list[Alert]) -> None:
    """Assess age-related risks."""
    if patient.age >= 80:
        alerts.append(Alert(
            severity="warning",
            title="Age-Related Risk: Very Elderly Patient",
            message=f"Patient age {patient.age} faces increased risks for falls, polypharmacy effects, and drug sensitivity.",
            source="Demographics",
            risk_score=0.45,
            recommendation="Enhanced monitoring, geriatric assessment, and medication review recommended."
        ))
    elif patient.age >= 65:
        alerts.append(Alert(
            severity="warning",
            title="Age-Related Considerations: Elderly Patient",
            message=f"Patient age {patient.age} may require dose adjustments and enhanced monitoring.",
            source="Demographics",
            risk_score=0.30,
            recommendation="Review all medications for age-appropriate dosing."
        ))


def _analyze_imaging(patient: PatientPayload, alerts: list[Alert]) -> None:
    """Analyze imaging findings for risks."""
    for report in patient.xray_reports:
        if report.urgency == "urgent" and report.risk_score and report.risk_score > 0.5:
            alerts.append(Alert(
                severity="critical",
                title=f"Urgent Imaging Finding: {report.report_type}",
                message=f"Urgent {report.report_type} of {report.body_part}. {report.findings}",
                source="Imaging",
                risk_score=0.75,
                recommendation="Immediate clinical review and follow-up required."
            ))


def _analyze_disease_progression(patient: PatientPayload, alerts: list[Alert]) -> None:
    """Analyze chronic disease progression."""
    if "Type 2 Diabetes" in patient.chronic_conditions:
        glucose_readings = [v for v in patient.vitals if v.type.lower() == "glucose"]
        if len(glucose_readings) >= 2:
            recent_high = sum(1 for v in glucose_readings[-3:] if numeric(v.value) > 180)
            if recent_high >= 2:
                alerts.append(Alert(
                    severity="warning",
                    title="Diabetes Control: Trend Worsening",
                    message="Recent glucose readings show pattern of elevated values (>180 mg/dL).",
                    source="Chronic Conditions",
                    risk_score=0.65,
                    recommendation="Increase diabetes medication or optimize dosage. Enhance lifestyle counseling."
                ))


def parse_bp(value: str) -> tuple[int, int] | None:
    """Parse blood pressure string format."""
    if "/" not in value:
        return None
    parts = value.split("/", 1)
    try:
        return int(parts[0].strip()), int(parts[1].strip())
    except (ValueError, IndexError):
        return None


def numeric(value: str) -> float:
    """Convert string to float safely."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def extract_numeric(dosage_str: str) -> float | None:
    """Extract numeric value from dosage string."""
    import re
    match = re.search(r'(\d+(?:\.\d+)?)', dosage_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None
    return None


def get_frequency_multiplier(frequency: str) -> float:
    """Get daily dose multiplier from frequency string."""
    freq_lower = frequency.lower()
    if "twice" in freq_lower or "2 times" in freq_lower or "bid" in freq_lower:
        return 2.0
    elif "three" in freq_lower or "3 times" in freq_lower or "tid" in freq_lower:
        return 3.0
    elif "four" in freq_lower or "4 times" in freq_lower or "qid" in freq_lower:
        return 4.0
    elif "once" in freq_lower or "daily" in freq_lower or "od" in freq_lower:
        return 1.0
    elif "needed" in freq_lower or "as needed" in freq_lower:
        return 0.5  # Conservative estimate
    else:
        return 1.0


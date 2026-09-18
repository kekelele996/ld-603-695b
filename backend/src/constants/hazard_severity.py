HazardSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SEVERITY_RANK = {name: index for index, name in enumerate(HazardSeverity)}


def escalate(severity: str, target: str = "CRITICAL") -> str:
    """逾期升级：只升不降，至少升到 target。"""
    current = SEVERITY_RANK.get(severity, 0)
    floor = SEVERITY_RANK[target]
    return HazardSeverity[max(current, floor)]

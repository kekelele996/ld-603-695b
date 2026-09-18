LOG_TEMPLATES = {
  "Building": [
    "Building.create",
    "Building.update",
    "Building.status",
    "Building.export"
  ],
  "FireDevice": [
    "FireDevice.create",
    "FireDevice.update",
    "FireDevice.status",
    "FireDevice.export",
    "FireDevice.lock_by_hazard: device={device_id} status=UNAVAILABLE",
    "FireDevice.restore_by_hazard: device={device_id} status=AVAILABLE"
  ],
  "InspectionTask": [
    "InspectionTask.create",
    "InspectionTask.update",
    "InspectionTask.status",
    "InspectionTask.export"
  ],
  "InspectionResult": [
    "InspectionResult.create",
    "InspectionResult.update",
    "InspectionResult.status",
    "InspectionResult.export",
    "InspectionResult.submit_abnormal: result={result_id} task={task_id} device={device_id}",
    "InspectionResult.submit_normal: result={result_id} task={task_id} device={device_id}"
  ],
  "HazardTicket": [
    "HazardTicket.create",
    "HazardTicket.update",
    "HazardTicket.status",
    "HazardTicket.export",
    "HazardTicket.open: ticket={ticket_id} result={result_id} severity={severity}",
    "HazardTicket.escalate: ticket={ticket_id} {old_severity}->{new_severity} reason=overdue",
    "HazardTicket.rectify_submit: ticket={ticket_id} owner={owner_id}",
    "HazardTicket.reinspect_pass: ticket={ticket_id} inspector={inspector_id}",
    "HazardTicket.reinspect_reject: ticket={ticket_id} inspector={inspector_id}",
    "HazardTicket.close: ticket={ticket_id} result={result_id} device={device_id}"
  ]
}

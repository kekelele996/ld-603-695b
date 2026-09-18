export interface CurrentUser {
  id: number;
  name: string;
  role: "INSPECTOR" | "MAINTAINER" | "SUPERVISOR" | "AUDITOR";
}

import * as React from "react";
import Alert from "@mui/material/Alert";
import CheckIcon from "@mui/icons-material/Check";

type AlertProps = {
  text: string;
};

export default function SimpleAlert(alert: AlertProps) {
  return (
    <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
      {alert.text}
    </Alert>
  );
}

import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

type SelectProps = {
  label: string;
  value: string;
  handleChange: any;
  items: any;
};
export default function BasicSelect(props: SelectProps) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">{props.label}</InputLabel>
        <Select
          size="small"
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={props.value}
          label={props.value}
          onChange={props.handleChange}
        >
          {props?.items.length &&
            props?.items.map((item: any) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
}

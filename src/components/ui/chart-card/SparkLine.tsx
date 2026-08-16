"use client";

import { Stack } from "@mui/material";
import Box from "@mui/material/Box";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";

export default function SparkLine() {
  return (
    <Stack direction="column" sx={{ width: "25%" }}>
      <Stack direction="row" sx={{ width: "100%" }}></Stack>
      <Stack direction="row" sx={{ width: "100%" }}>
        <Box sx={{ flexGrow: 1 }}>
          <SparkLineChart
            data={[1, 4, 2, 5, 7, 2, 4, 6, 8, 9, 1, 7, 12, 5, 3, 8]}
            height={100}
            color="#036b80"
            curve="natural"
            disableClipping
            slotProps={{
              line: { filter: "url(#lineShadow)" },
            }}
          >
            <defs>
              <filter
                id="lineShadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="6"
                  floodColor="#036b80"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>
          </SparkLineChart>
        </Box>
      </Stack>
    </Stack>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (row: T) => JSX.Element;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
}

export function DataTable<T>({ columns, data, getRowKey }: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: "100%",
        overflowX: "auto",
        marginBottom: "1rem",
        marginTop: "1rem",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(
              (column) =>
                !(isMobile && column.hideOnMobile) && (
                  <TableCell key={String(column.accessor)}>
                    {column.header}
                  </TableCell>
                )
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map(
                (column) =>
                  !(isMobile && column.hideOnMobile) && (
                    <TableCell key={String(column.accessor)}>
                      {column.render
                        ? column.render(row)
                        : String(row[column.accessor])}
                    </TableCell>
                  )
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

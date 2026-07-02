from . import csv_parser, excel_parser, pdf_parser, pbix_parser

PARSER_REGISTRY: dict = {
    ".csv":  csv_parser.parse,
    ".tsv":  csv_parser.parse,
    ".xlsx": excel_parser.parse,
    ".xlsm": excel_parser.parse,
    ".xls":  excel_parser.parse,
    ".pdf":  pdf_parser.parse,
    ".pbix": pbix_parser.parse,
}

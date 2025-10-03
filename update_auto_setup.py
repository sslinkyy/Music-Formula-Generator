from pathlib import Path
module_path = Path("RGF_Module.bas")
text = module_path.read_text(encoding="utf-8")
marker = "Private Function SheetExistsRGF(Name As String) As Boolean"
if marker not in text:
    raise SystemExit('SheetExistsRGF marker not found')
new_block = "Public Sub RGF_AutoSetupIfNeeded()\r\n    On Error GoTo exitClean\r\n    Application.ScreenUpdating = False\r\n    If Not SheetExistsRGF(\"RGF_Sheet\") Then\r\n        RGF_OneClickSetup\r\n    ElseIf Not NamedRangeExists(\"RGF_Theme\") Then\r\n        SetupAIPrompting\r\n    End If\r\nexitClean:\r\n    Application.ScreenUpdating = True\r\nEnd Sub\r\n\r\nPrivate Function NamedRangeExists(ByVal nameText As String) As Boolean\r\n    Dim wb As Workbook: Set wb = ThisWorkbook\r\n    Dim nm As Name\r\n    On Error Resume Next\r\n    Set nm = wb.Names(nameText)\r\n    NamedRangeExists = (Err.Number = 0)\r\n    Err.Clear\r\n    On Error GoTo 0\r\nEnd Function\r\n\r\n"
text = text.replace(marker, new_block + marker, 1)
module_path.write_text(text, encoding="utf-8")

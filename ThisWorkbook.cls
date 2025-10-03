VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub Workbook_Open()
    On Error GoTo exitHandler
    Application.EnableEvents = False
    RGF_AutoSetupIfNeeded
exitHandler:
    Application.EnableEvents = True
End Sub

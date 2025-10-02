Option Explicit
' =============================================================================
' RGF f·p·e — COMPLETE MASTER MODULE (ONE FILE)
' iMob Worldwide x Suno v5
'
' WHAT'S INSIDE
' - RGF_Sheet builder (φ, π, e math; weights; inputs)
' - User Sections (Title/Intro/Hook/Verse1/Verse2/Bridge/Outro/Notes)
' - Premise dropdown (human topics) + auto premise resolver
' - Preset buttons (Street/Club/Backpack/Streaming/Defaults)
' - Help sheet
' - Creative Brief generator
' - Suno exporter (brackets / (parentheses) / [*sfx*] enforced)
' - AI Prompt Builder (strict Suno blocks + SANITY CHECK rules)
' - Optional OpenAI-compatible API call from Excel
' - Genre Library + dropdown + Apply Genre (weights + style/exclude)
' - One-click setup macros
'
' QUICK START
' 1) Run RGF_OneClickSetup.
' 2) Pick a Genre in E2 (optional) and a Premise in E10 (optional).
' 3) Adjust Base/Derived inputs + Weights or use presets.
' 4) Click Make Brief / Make Suno.
' 5) Build Prompt → (optional) Call AI (requires API key).
' =============================================================================


'========================
' BUILD MAIN SHEET
'========================
Public Sub BuildRGFSheet()
    Dim ws As Worksheet, r As Long
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("RGF_Sheet")
    On Error GoTo 0
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add
        ws.Name = "RGF_Sheet"
    Else
        ws.Cells.Clear
        DeletePresetButtons ws
    End If

    ws.Range("A1").Value = "Section"
    ws.Range("B1").Value = "Label"
    ws.Range("C1").Value = "Value"
    With ws.Range("A1:C1")
        .Font.Bold = True
        .Interior.Color = RGB(34, 139, 230)
        .Font.Color = vbWhite
    End With

    r = 2
    AddRow ws, r, "TITLE", "RGF f·p·e Scoring Sheet", ""

    ' Constants
    AddRow ws, r, "Constants", "phi (φ)", "=(1+SQRT(5))/2"
    AddRow ws, r, "Constants", "pi (π)", "=PI()"
    AddRow ws, r, "Constants", "e", "=EXP(1)"

    ' Controls
    AddRow ws, r, "Controls", "kappa (κ)", "0.5"
    AddRow ws, r, "Controls", "mu (µ)", "0.6"
    AddRow ws, r, "Controls", "lambda (λ)", "1.0"

    ' Weights
    AddRow ws, r, "Weights", "w_c (Core)", "0.24"
    AddRow ws, r, "Weights", "w_t (Tech)", "0.16"
    AddRow ws, r, "Weights", "w_a (Anthem)", "0.20"
    AddRow ws, r, "Weights", "w_s (Style)", "0.14"
    AddRow ws, r, "Weights", "w_g (Group)", "0.14"
    AddRow ws, r, "Weights", "w_p (Perf)", "0.12"
    AddRow ws, r, "Weights", "Weights Sum", "=SUM(C9:C14)"

    ' Base Inputs (0–10)
    AddRow ws, r, "Base Inputs (0–10)", "Cadence (C)", "9"
    AddRow ws, r, "Base Inputs (0–10)", "Feel (F)", "8"
    AddRow ws, r, "Base Inputs (0–10)", "Wordplay (W)", "8.5"
    AddRow ws, r, "Base Inputs (0–10)", "Lyrical Depth (L)", "7"
    AddRow ws, r, "Base Inputs (0–10)", "Beat Fit (B)", "9"
    AddRow ws, r, "Base Inputs (0–10)", "Performance (P)", "8"
    AddRow ws, r, "Base Inputs (0–10)", "Structure (S)", "7.5"
    AddRow ws, r, "Base Inputs (0–10)", "Versatility (V)", "6"
    AddRow ws, r, "Base Inputs (0–10)", "Anthemic (A)", "8.8"
    AddRow ws, r, "Base Inputs (0–10)", "Complexity (X)", "7"
    AddRow ws, r, "Base Inputs (0–10)", "Style (Y)", "8.2"

    ' Derived Inputs (0–1)
    AddRow ws, r, "Derived Inputs", "Rhyme Entropy H_rhyme", "0.65"
    AddRow ws, r, "Derived Inputs", "Multis per bar M_multi", "0.70"
    AddRow ws, r, "Derived Inputs", "Flow Variance Var_flow", "0.50"
    AddRow ws, r, "Derived Inputs", "Chantability Q_chant", "0.80"
    AddRow ws, r, "Derived Inputs", "Crowd Response R_crowd", "0.65"
    AddRow ws, r, "Derived Inputs", "Originality U", "0.70"
    AddRow ws, r, "Derived Inputs", "Timbre Cohesion S_tone", "0.80"
    AddRow ws, r, "Derived Inputs", "Swagger Phase φ (0–1)", "0.60"
    AddRow ws, r, "Derived Inputs", "Dynamic Range D", "0.70"
    AddRow ws, r, "Derived Inputs", "Cosine Match cosa (-1..1)", "0.75"
    AddRow ws, r, "Derived Inputs", "Phase Drift φf (fraction of π)", "0.30"
    AddRow ws, r, "Derived Inputs", "Group Manual Fit G", "0.75"

    ' Normalized helpers
    AddRow ws, r, "Normalized", "C_norm", "=C16/10"
    AddRow ws, r, "Normalized", "F_norm", "=C17/10"
    AddRow ws, r, "Normalized", "W_norm", "=C18/10"
    AddRow ws, r, "Normalized", "L_norm", "=C19/10"
    AddRow ws, r, "Normalized", "B_norm", "=C20/10"
    AddRow ws, r, "Normalized", "P_norm", "=C21/10"
    AddRow ws, r, "Normalized", "S_norm", "=C22/10"
    AddRow ws, r, "Normalized", "V_norm", "=C23/10"
    AddRow ws, r, "Normalized", "A_norm", "=C24/10"
    AddRow ws, r, "Normalized", "X_norm", "=C25/10"
    AddRow ws, r, "Normalized", "Y_norm", "=C26/10"
    AddRow ws, r, "Helper", "φf_rad", "=C37*C4"

    ' BLOCKS
    AddRow ws, r, "BLOCKS", "Core", "=POWER(C39^C3*C41^SQRT(C4)*C43^C5*C45^LN(C4)*C40^SQRT(C3),1/(C3+SQRT(C4)+C5+LN(C4)+SQRT(C3)))"
    AddRow ws, r, "BLOCKS", "Sync", "=(1+COS(C50))/2"
    AddRow ws, r, "BLOCKS", "Core*", "=C51^(C3/C4)*C52^SQRT(C3)"
    AddRow ws, r, "BLOCKS", "Tech", "=1/(1+EXP(-(C4*C27+SQRT(C3)*LN(1+C5*C28))))*EXP(C6*C29)"
    AddRow ws, r, "BLOCKS", "Anthem", "=POWER(C47^C3*C30^SQRT(2),1/(C3+SQRT(2)))*(1-EXP(-C4*C31))"
    AddRow ws, r, "BLOCKS", "StyleSig", "=EXP(C7*C32)*POWER((C49+C33)/2,LN(C3))*(1+(1/C4)*SIN(C4*C34))"
    AddRow ws, r, "BLOCKS", "Group", "=POWER((1+C36)/2,C3)*(1/(1+EXP(-SQRT(C4)*C38)))"
    AddRow ws, r, "BLOCKS", "Perf", "=POWER(C44*C35^(1/C4),TANH(C4*C46/2))"
    AddRow ws, r, "BLOCKS", "Regularizer R", "=EXP(-C8*MAX(C48-((C3-1)/C3),0)*C4)"

    ' FINAL
    AddRow ws, r, "FINAL", "RGF_phi_pi_e", "=100*POWER(C53^(C9*C3/C4)*C54^(C10*C4/C5)*C55^(C11*SQRT(C3))*C56^(C12*LN(C3))*C57^(C13*C5/C4)*C58^(C14*SQRT(C4)),1/C15)*C59"
    AddRow ws, r, "FINAL", "Clamped (0..100)", "=MIN(100,MAX(0,C60))"
    AddRow ws, r, "FINAL", "Preset Note", "Use presets (buttons) or edit weights C9:C14."

    ' User sections
    AddUserSectionsBlock ws

    ' Side-panel UI: Genre & Premise
    ws.Range("E1").Value = "Genre": ws.Range("E1").Font.Bold = True
    ws.Range("E2").Interior.Color = RGB(240, 255, 240)

    ws.Range("E9").Value = "Premise": ws.Range("E9").Font.Bold = True
    ws.Range("E10").ClearContents
    With ws.Range("E10").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, _
             Formula1:="love & loyalty,heartbreak & healing,hustle & ambition,betrayal & trust,triumph & celebration,redemption & growth,city pride & belonging,struggle & perseverance,(auto)"
        .IgnoreBlank = True: .InCellDropdown = True
        .InputTitle = "Pick a core premise"
        .InputMessage = "Choose a human theme for the lyrics. '(auto)' uses Theme/Keywords/Audience."
    End With
    If Len(Trim$(ws.Range("E10").Value)) = 0 Then ws.Range("E10").Value = "(auto)"

    ws.Columns("A:C").AutoFit
    ActiveWindow.SplitRow = 1
    ActiveWindow.FreezePanes = True
    ColorBySection ws
    AddScoreBands ws

    AddDV ws.Range("C16:C26"), "Base Inputs 0–10", "Enter 0–10. Sheet normalizes to 0–1.", 0, 10
    AddDV ws.Range("C27:C38"), "Derived Inputs 0–1", "Enter 0–1. Q_chant≈0.7–0.9; R_crowd≈0.5–0.8; cosa∈[-1,1].", 0, 1
    AddDV ws.Range("C9:C14"), "Weights", "Weights should sum ≈1. Use preset buttons or edit directly.", 0, 1

    AddPresetButtons ws
    AddBriefAndSunoButtons
    With ws.Range("C60"): .NumberFormat = "0.0": .Font.Bold = True: End With
End Sub

'========================
' USER SECTIONS
'========================
Private Sub AddUserSectionsBlock(ws As Worksheet)
    Dim startRow As Long, labels As Variant, i As Long
    startRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row + 2
    ws.Cells(startRow, 1).Value = "USER SECTIONS (optional — used verbatim if filled)"
    ws.Cells(startRow, 1).Font.Bold = True

    labels = Array("Title idea", "Intro", "Hook / Chorus", "Verse 1", "Verse 2", "Bridge", "Outro", "Notes")
    For i = 0 To UBound(labels)
        ws.Cells(startRow + 1 + i, 1).Value = labels(i)
        ws.Cells(startRow + 1 + i, 3).Value = ""
        ws.Rows(startRow + 1 + i).RowHeight = 42
    Next i

    With ws.Range(ws.Cells(startRow, 1), ws.Cells(startRow + UBound(labels) + 1, 3))
        .Interior.Color = RGB(255, 250, 230)
        .WrapText = True
        .VerticalAlignment = xlTop
    End With
End Sub

'========================
' HELP SHEET
'========================
Public Sub BuildHelpSheet()
    Dim sh As Worksheet, row As Long, lines() As String, i As Long
    On Error Resume Next: Set sh = ThisWorkbook.Worksheets("RGF_Help")
    On Error GoTo 0
    If sh Is Nothing Then
        Set sh = ThisWorkbook.Worksheets.Add
        sh.Name = "RGF_Help"
    Else
        sh.Cells.Clear
    End If

    row = 1
    sh.Cells(row, 1).Value = "RGF f·p·e — How to Use": sh.Cells(row, 1).Font.Bold = True: row = row + 2
    lines = BuildHelpLines()
    For i = LBound(lines) To UBound(lines)
        sh.Cells(row, 1).Value = lines(i)
        row = row + 1
    Next i
    sh.Columns("A").EntireColumn.AutoFit
End Sub

Private Function BuildHelpLines() As String()
    Dim tmp() As String, n As Long
    ReDim tmp(1 To 24)
    n = 0
    n = n + 1: tmp(n) = "1) Choose a preset or set C9:C14 (weights)."
    n = n + 1: tmp(n) = "2) Score Base Inputs 0–10 (C16:C26) and Derived 0–1 (C27:C38)."
    n = n + 1: tmp(n) = "3) (Optional) Fill USER SECTIONS (verbatim lock for Suno)."
    n = n + 1: tmp(n) = "4) Pick Genre (E2) and Premise (E10) — Premise steers story."
    n = n + 1: tmp(n) = "5) Click Make Brief / Make Suno."
    n = n + 1: tmp(n) = "6) Setup AI → Build Prompt → (optional) Call AI with API key."
    n = n + 1: tmp(n) = "Formatting: [Meta Tags], (other voices), [* noises *]. Style block uses [tag | tag | …]."
    ReDim Preserve tmp(1 To n)
    BuildHelpLines = tmp
End Function

'========================
' PRESET BUTTONS
'========================
Private Sub AddPresetButtons(ws As Worksheet)
    Dim x As Single, y As Single, w As Single, h As Single
    x = ws.Columns("J").Left
    y = ws.Rows(3).Top
    w = 95: h = 22

    CreateButtonRGF ws, x, y, w, h, "Street", "Preset_Street", "btn_Preset_Street"
    CreateButtonRGF ws, x + (w + 8), y, w, h, "Club", "Preset_Club", "btn_Preset_Club"
    CreateButtonRGF ws, x + 2 * (w + 8), y, w, h, "Backpack", "Preset_Backpack", "btn_Preset_Backpack"
    CreateButtonRGF ws, x + 3 * (w + 8), y, w, h, "Streaming", "Preset_Streaming", "btn_Preset_Streaming"
    CreateButtonRGF ws, x, y + (h + 10), w + 3 * (w + 8), h, "Reset Defaults", "Preset_Defaults", "btn_Preset_Defaults"
End Sub

Private Sub CreateButtonRGF(ws As Worksheet, Left As Single, Top As Single, Width As Single, Height As Single, _
                         caption As String, macroName As String, btnName As String)
    Dim sh As Shape
    Set sh = ws.Shapes.AddShape(msoShapeRoundedRectangle, Left, Top, Width, Height)
    With sh
        .Name = btnName
        .OnAction = macroName
        .Fill.ForeColor.RGB = RGB(245, 245, 245)
        .Line.ForeColor.RGB = RGB(160, 160, 160)
        With .TextFrame2
            .TextRange.Text = caption
            .TextRange.ParagraphFormat.Alignment = msoAlignCenter
            .VerticalAnchor = msoAnchorMiddle
            .WordWrap = msoTrue
            .MarginLeft = 2: .MarginRight = 2: .MarginTop = 1: .MarginBottom = 1
            With .TextRange.Font
                .Name = "Segoe UI": .Size = 9
                .Fill.ForeColor.RGB = RGB(0, 0, 0)
            End With
        End With
    End With
End Sub

Private Sub DeletePresetButtons(ws As Worksheet)
    Dim sh As Shape, del As Collection, i As Long
    Set del = New Collection
    For Each sh In ws.Shapes
        If Left$(sh.Name, 4) = "btn_" Then del.Add sh.Name
    Next sh
    For i = 1 To del.Count
        ws.Shapes(del(i)).Delete
    Next i
End Sub

Public Sub Preset_Street():    SetWeights 0.27, 0.21, 0.16, 0.14, 0.14, 0.08: End Sub
Public Sub Preset_Club():      SetWeights 0.21, 0.1, 0.28, 0.12, 0.12, 0.17: End Sub
Public Sub Preset_Backpack():  SetWeights 0.22, 0.23, 0.14, 0.17, 0.14, 0.1: End Sub
Public Sub Preset_Streaming(): SetWeights 0.27, 0.12, 0.26, 0.12, 0.11, 0.12: End Sub
Public Sub Preset_Defaults():  SetWeights 0.24, 0.16, 0.2, 0.14, 0.14, 0.12: End Sub

Private Sub SetWeights(wc As Double, wt As Double, wa As Double, ws_ As Double, wg As Double, wp As Double)
    With Worksheets("RGF_Sheet")
        .Range("C9").Value = wc
        .Range("C10").Value = wt
        .Range("C11").Value = wa
        .Range("C12").Value = ws_
        .Range("C13").Value = wg
        .Range("C14").Value = wp
        .Range("C15").Formula = "=SUM(C9:C14)"
    End With
End Sub

'========================
' BRIEF BUTTONS
'========================
Public Sub AddBriefAndSunoButtons()
    If Not SheetExistsRGF("RGF_Sheet") Then Exit Sub
    Dim ws As Worksheet: Set ws = Worksheets("RGF_Sheet")
    Dim x As Single, y As Single, w As Single, h As Single
    x = ws.Columns("J").Left: w = 120: h = 24
    y = ws.Rows(8).Top + 80
    CreateButtonRGF ws, x, y, w, h, "Make Brief", "GenerateCreativeBrief", "btn_MakeBrief"
    CreateButtonRGF ws, x + (w + 10), y, w, h, "Make Suno", "GenerateSunoFromSheet", "btn_MakeSuno"
End Sub

'========================
' CREATIVE BRIEF
'========================
Public Sub GenerateCreativeBrief()
    Dim ws As Worksheet: Set ws = Worksheets("RGF_Sheet")
    Dim b As Worksheet
    On Error Resume Next: Set b = Worksheets("Creative_Brief")
    On Error GoTo 0
    If b Is Nothing Then
        Set b = Worksheets.Add(After:=ws): b.Name = "Creative_Brief"
    Else
        b.Cells.Clear
    End If

    Dim Core#, Tech#, Anthem#, StyleSig#, GroupF#, Perf#, Reg#, SyncV#, FinalScore#
    Core = NzD(ws.Range("C50").Value): Tech = NzD(ws.Range("C53").Value): Anthem = NzD(ws.Range("C54").Value)
    StyleSig = NzD(ws.Range("C55").Value): GroupF = NzD(ws.Range("C56").Value): Perf = NzD(ws.Range("C57").Value)
    Reg = NzD(ws.Range("C58").Value): SyncV = NzD(ws.Range("C51").Value): FinalScore = NzD(ws.Range("C60").Value)
    Dim Sn#, Vn#: Sn = NzD(ws.Range("C22").Value) / 10: Vn = NzD(ws.Range("C23").Value) / 10

    Dim tempo$, structure$, hookPlan$, flowPlan$, rhymePlan$, adlibs$, audience$, vibe$
    If Anthem >= 0.8 And Core >= 0.8 Then
        tempo = "energetic, anthemic pocket"
    ElseIf Tech >= 0.7 And Core >= 0.75 Then
        tempo = "tight pocket, agile bounce"
    Else
        tempo = "modern groove, confident bounce"
    End If

    If Sn >= 0.75 And Vn >= 0.6 Then
        structure = "Intro 4 → Hook 8 → Verse1 16 → Hook 8 → Verse2 16 → Bridge 4–8 → Hook 8 → Outro 4"
    ElseIf Sn >= 0.6 Then
        structure = "Intro 4 → Hook 8 → Verse 16 → Hook 8 → Verse 16 → Hook 8"
    Else
        structure = "Intro 2 → Hook 8 → Verse 12 → Hook 8 → Verse 12 → Hook 8"
    End If

    If Anthem >= 0.8 Then
        hookPlan = "Chantable 4–6 words; 2-bar call/response; gang vox last 2 bars"
    ElseIf Anthem >= 0.65 Then
        hookPlan = "Memorable phrase + micro-melody; doubles on bars 5–8"
    Else
        hookPlan = "Understated hook; verse motif leads; optional post-hook ad-lib"
    End If
    If SyncV < 0.7 Then hookPlan = hookPlan & " • Re-cut for pocket (φf high)."

    If Tech >= 0.75 And Reg >= 0.95 Then
        flowPlan = "Two switch-ups per 16; brief double-time burst."
        rhymePlan = "2–4 internal multis/line; end-rhyme chain every 2 bars."
    ElseIf Tech >= 0.6 Then
        flowPlan = "One switch-up per 16; pocket-first."
        rhymePlan = "1–2 internal multis/line; consistent end-rhyme."
    Else
        flowPlan = "Single flow per verse; diction-forward."
        rhymePlan = "End-rhyme only; occasional internal."
    End If
    If Reg < 0.9 Then rhymePlan = rhymePlan & " • R low: simplify one scheme/verse."

    If Perf >= 0.7 Then
        adlibs = "Hook: main + double + L/R backs; Verses: backs on bars 13–16; hype ad-libs on punchlines (±30% pan)."
    Else
        adlibs = "Hook: single double; Verses: sparse ad-libs on key punchlines."
    End If

    If GroupF >= 0.75 Then
        audience = "Add 2 local slang + 1 place/object + 1 shared pain/goal."
    ElseIf GroupF >= 0.6 Then
        audience = "Broad references; one subtle nod."
    Else
        audience = "Keep universal messaging."
    End If

    If StyleSig >= 0.75 Then
        vibe = "Distinct timbre; signature phrase repeats tastefully"
    ElseIf StyleSig < 0.6 Then
        vibe = "Minimal FX; diction forward"
    Else
        vibe = "Cohesive tone; one tasteful delay throw"
    End If

    b.Range("A1").Value = "Creative Brief (Auto-generated)"
    b.Range("A1").Font.Bold = True
    b.Range("A3").Value = "Final Score":       b.Range("B3").Value = Format(FinalScore, "0.0")
    b.Range("A4").Value = "Feel":              b.Range("B4").Value = tempo
    b.Range("A5").Value = "Structure":         b.Range("B5").Value = structure
    b.Range("A6").Value = "Hook Plan":         b.Range("B6").Value = hookPlan
    b.Range("A7").Value = "Flow Plan":         b.Range("B7").Value = flowPlan
    b.Range("A8").Value = "Rhyme Plan":        b.Range("B8").Value = rhymePlan
    b.Range("A9").Value = "Ad-libs":           b.Range("B9").Value = adlibs
    b.Range("A10").Value = "Audience":         b.Range("B10").Value = audience
    b.Range("A11").Value = "Style/Vibe":       b.Range("B11").Value = vibe
    b.Range("A13").Value = "Note":             b.Range("B13").Value = "Tweak inputs or weights; regenerate as needed."
    b.Columns("A:B").EntireColumn.AutoFit
End Sub

'========================
' SUNO (4 BLOCKS)
'========================
Public Sub GenerateSunoFromSheet()
    Dim ws As Worksheet: Set ws = Worksheets("RGF_Sheet")
    Dim s As Worksheet
    On Error Resume Next: Set s = Worksheets("Suno_Blocks"): On Error GoTo 0
    If s Is Nothing Then
        Set s = Worksheets.Add(After:=ws): s.Name = "Suno_Blocks"
    Else
        s.Cells.Clear
    End If

    Dim Anthem#, Tech#, StyleSig#, SyncV#, GroupF#, FinalScore#
    Anthem = NzD(ws.Range("C54").Value): Tech = NzD(ws.Range("C53").Value)
    StyleSig = NzD(ws.Range("C55").Value): SyncV = NzD(ws.Range("C51").Value)
    GroupF = NzD(ws.Range("C56").Value): FinalScore = NzD(ws.Range("C60").Value)

    Dim tempoHint$, structureHint$, excludeCsv$, styleLine$
    tempoHint = IIf(Anthem >= 0.75, "100–110 bpm feel", IIf(Tech >= 0.7, "84–96 bpm feel", "92–104 bpm feel"))
    styleLine = NormalizeStyleTagsFromList("anthemic rap", "chant hook", "pocket-tight flow", "minor-key trap", tempoHint, "warm 808s", "internal rhymes", "evolving chorus", "call-and-response", "ad-lib stacks")

    Dim gOK As Boolean, gStyle$, gTempo$, gStruct$, gExclude$
    gOK = ReadCurrentGenre(gStyle, gTempo, gStruct, gExclude)
    If gOK Then
        styleLine = gStyle
        If Len(Trim$(gTempo)) > 0 Then tempoHint = gTempo
        structureHint = gStruct
        excludeCsv = gExclude
    End If

    Dim title$: title = FirstNonEmpty(SectionText(ws, "Title idea"), IIf(FinalScore >= 90, "Prime Cosine (RGF Run-Up)", IIf(FinalScore >= 80, "Phi In The Pocket (RGF Anthem)", "Function on Fire (RGF Build)")))

    Dim L() As String, k As Long
    AppendLine L, "[Producer Tag] iMob Worldwide!"
    AppendLine L, ""

    AppendBlockOrGenerated L, ws, "Intro", BuildIntro()
    If Len(Trim$(SectionText(ws, "Hook / Chorus"))) > 0 Then
        AppendLine L, "[HOOK]": AppendLinesFromCell L, SectionText(ws, "Hook / Chorus")
    Else
        AppendBlock L, BuildHook(SyncV, GroupF, Anthem)
    End If
    If Len(Trim$(SectionText(ws, "Verse 1"))) > 0 Then
        AppendLine L, "[Verse 1]": AppendLinesFromCell L, SectionText(ws, "Verse 1")
    Else
        AppendBlock L, BuildVerseDeterministic(Tech, StyleSig, 1)
    End If
    If Len(Trim$(SectionText(ws, "Hook / Chorus"))) > 0 Then
        AppendLine L, "[HOOK – reprise]": AppendLinesFromCell L, SectionText(ws, "Hook / Chorus")
    Else
        AppendBlock L, BuildHookEvolve(Anthem, GroupF)
    End If
    If Len(Trim$(SectionText(ws, "Verse 2"))) > 0 Then
        AppendLine L, "[Verse 2]": AppendLinesFromCell L, SectionText(ws, "Verse 2")
    Else
        AppendBlock L, BuildVerseDeterministic(Tech, StyleSig, 2)
    End If
    AppendBlockOrGenerated L, ws, "Bridge", BuildBridgeDeterministic(StyleSig, GroupF)
    AppendBlockOrGenerated L, ws, "Outro", BuildOutroDeterministic()

    If ArrAllocated(L) Then For k = LBound(L) To UBound(L): L(k) = NormalizeMetaTag(L(k)): Next k

    s.Cells(1, 1).Value = "```": s.Cells(2, 1).Value = title: s.Cells(3, 1).Value = "```"
    s.Cells(5, 1).Value = "```": s.Cells(6, 1).Value = styleLine: s.Cells(7, 1).Value = "```"
    s.Cells(9, 1).Value = "```": s.Cells(10, 1).Value = IIf(Len(Trim$(excludeCsv)) > 0, LCase$(excludeCsv), "pop, edm, hyperpop, house"): s.Cells(11, 1).Value = "```"
    s.Cells(13, 1).Value = "```": s.Cells(14, 1).Value = Join(L, vbCrLf): s.Cells(15, 1).Value = "```"

    s.Columns("A").ColumnWidth = 120
    s.Rows("1:15").WrapText = True
End Sub

'========================
' AI PROMPT BUILDER + API
'========================
Public Sub SetupAIPrompting()
    Dim ws As Worksheet: Set ws = Worksheets("RGF_Sheet")
    AddKeywordFields ws
    AddAIButtons ws
    BuildAISettingsSheet
    If Not SheetExistsRGF("AI_Prompt") Then Worksheets.Add(After:=ws).Name = "AI_Prompt"
End Sub

Private Sub AddKeywordFields(ws As Worksheet)
    Dim startRow As Long: startRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row + 2
    ws.Cells(startRow, 1).Value = "AI Prompt Builder": ws.Cells(startRow, 1).Font.Bold = True

    ws.Cells(startRow + 1, 1).Value = "Theme"
    ws.Cells(startRow + 2, 1).Value = "Keywords (comma-separated)"
    ws.Cells(startRow + 3, 1).Value = "Must-include words/phrases"
    ws.Cells(startRow + 4, 1).Value = "Forbidden words/phrases"
    ws.Cells(startRow + 5, 1).Value = "Style/Mood tags (comma-separated)"
    ws.Cells(startRow + 6, 1).Value = "Length target (min)"
    ws.Cells(startRow + 7, 1).Value = "Audience notes"

    ws.Cells(startRow + 1, 3).Value = ws.Range("C42").Value
    ws.Cells(startRow + 2, 3).Value = ""
    ws.Cells(startRow + 3, 3).Value = ""
    ws.Cells(startRow + 4, 3).Value = ""
    ws.Cells(startRow + 5, 3).Value = "anthemic rap, chant hook, pocket-tight flow"
    ws.Cells(startRow + 6, 3).Value = 3
    ws.Cells(startRow + 7, 3).Value = ""

    With ws.Range(ws.Cells(startRow, 1), ws.Cells(startRow + 7, 3)).Interior
        .Color = RGB(240, 248, 255)
    End With
    ws.Columns("A:C").AutoFit
End Sub

Private Sub AddAIButtons(ws As Worksheet)
    Dim x As Single, y As Single, w As Single, h As Single, baseY As Single
    x = ws.Columns("J").Left: w = 120: h = 24
    On Error Resume Next
    baseY = ws.Shapes("btn_MakeSuno").Top + ws.Shapes("btn_MakeSuno").Height + 10
    If baseY = 0 Then baseY = ws.Rows(20).Top
    On Error GoTo 0
    CreateButtonRGF ws, x, baseY, w, h, "Build Prompt", "BuildPromptFromSheet", "btn_BuildPrompt"
    CreateButtonRGF ws, x + (w + 10), baseY, w, h, "Call AI (API)", "CallAIFromSheet", "btn_CallAI"
End Sub

Public Sub BuildPromptFromSheet()
    Dim src As Worksheet: Set src = Worksheets("RGF_Sheet")
    Dim out As Worksheet
    If Not SheetExistsRGF("AI_Prompt") Then
        Set out = Worksheets.Add(After:=src): out.Name = "AI_Prompt"
    Else
        Set out = Worksheets("AI_Prompt"): out.Cells.Clear
    End If

    Dim Anthem#, Tech#, StyleSig#, SyncV#, GroupF#, FinalScore#
    Anthem = NzD(src.Range("C54").Value)
    Tech = NzD(src.Range("C53").Value)
    StyleSig = NzD(src.Range("C55").Value)
    SyncV = NzD(src.Range("C51").Value)
    GroupF = NzD(src.Range("C56").Value)
    FinalScore = NzD(src.Range("C60").Value)

    Dim Sn#, Vn#, Reg#
    Sn = NzD(src.Range("C22").Value) / 10
    Vn = NzD(src.Range("C23").Value) / 10
    Reg = NzD(src.Range("C58").Value)

    Dim theme$, keywords$, musts$, forbids$, tagsCsv$, mins$, aud$
    theme = Trim$(CStr(src.Cells(FindLabelRow(src, "Theme"), "C").Value))
    keywords = Trim$(CStr(src.Cells(FindLabelRow(src, "Keywords (comma-separated)"), "C").Value))
    musts = Trim$(CStr(src.Cells(FindLabelRow(src, "Must-include words/phrases"), "C").Value))
    forbids = Trim$(CStr(src.Cells(FindLabelRow(src, "Forbidden words/phrases"), "C").Value))
    tagsCsv = Trim$(CStr(src.Cells(FindLabelRow(src, "Style/Mood tags (comma-separated)"), "C").Value))
    mins = Trim$(CStr(src.Cells(FindLabelRow(src, "Length target (min)"), "C").Value))
    aud = Trim$(CStr(src.Cells(FindLabelRow(src, "Audience notes"), "C").Value))

    Dim tempo$, structure$, hookPlan$, flowPlan$, rhymePlan$, audience$, vibe$, premise$
    If Anthem >= 0.8 And NzD(src.Range("C50").Value) >= 0.8 Then
        tempo = "energetic, anthemic pocket"
    ElseIf Tech >= 0.7 And NzD(src.Range("C50").Value) >= 0.75 Then
        tempo = "tight pocket, agile bounce"
    Else
        tempo = "modern groove, confident bounce"
    End If

    If Sn >= 0.75 And Vn >= 0.6 Then
        structure = "Intro 4 → Hook 8 → Verse1 16 → Hook 8 → Verse2 16 → Bridge 4–8 → Hook 8 → Outro 4"
    ElseIf Sn >= 0.6 Then
        structure = "Intro 4 → Hook 8 → Verse 16 → Hook 8 → Verse 16 → Hook 8"
    Else
        structure = "Hook 8 → Verse 12 → Hook 8 → Verse 12 → Hook 8"
    End If

    If Anthem >= 0.8 Then
        hookPlan = "Chantable phrase; 2-bar call/response; gang vox last 2 bars"
    ElseIf Anthem >= 0.65 Then
        hookPlan = "Memorable phrase + micro-melody; doubles on bars 5–8"
    Else
        hookPlan = "Understated hook; verse motif drives; optional post-hook ad-lib"
    End If

    If Tech >= 0.75 And Reg >= 0.95 Then
        flowPlan = "Two switch-ups per 16; brief double-time burst"
        rhymePlan = "2–4 internal multis/line; end-rhyme chain every 2 bars"
    ElseIf Tech >= 0.6 Then
        flowPlan = "One switch-up per 16; pocket-first"
        rhymePlan = "1–2 internal multis/line; consistent end-rhyme"
    Else
        flowPlan = "Single flow per verse; diction-forward"
        rhymePlan = "End-rhyme only; occasional internal"
    End If

    If StyleSig >= 0.75 Then
        vibe = "Distinct timbre; signature phrase repeats tastefully"
    ElseIf StyleSig < 0.6 Then
        vibe = "Minimal FX; diction forward"
    Else
        vibe = "Cohesive tone; one tasteful delay throw"
    End If

    If GroupF >= 0.75 Then
        audience = "Add 2 local slang + 1 place/object + 1 shared pain/goal. " & aud
    ElseIf GroupF >= 0.6 Then
        audience = "Broad references; one subtle nod. " & aud
    Else
        audience = "Keep universal messaging. " & aud
    End If

    premise = ResolvePremise()

    ' ===== GENRE OVERRIDES =====
    Dim gStyle$, gTempo$, gStruct$, gExclude$, hasW As Boolean, wc#, wt#, wa#, ws_#, wg#, wp#, gName$
    gName = Trim$(CStr(src.Range("E2").Value))
    If ReadCurrentGenre(gStyle, gTempo, gStruct, gExclude, hasW, wc, wt, wa, ws_, wg, wp) Then
        If Len(Trim$(gTempo)) > 0 Then tempo = gTempo
        If Len(Trim$(gStruct)) > 0 Then structure = gStruct
    End If

    Dim P() As String
    AppendLine P, "You are Suno v5 Lyrical Expert – iMob Worldwide. Generate a completely original song."
    AppendLine P, "Output exactly four code blocks, in this order: 1) title 2) style 3) exclude 4) lyrics."
    AppendLine P, "Formatting rules (MANDATORY):"
    AppendLine P, "• All meta tags/directives must be in [square brackets]. Examples: [HOOK], [Verse 1], [Bridge], [Outro], [Chant], [Gang Vox], [delay hits hard]."
    AppendLine P, "• Any words by another voice / echo / ad-lib go in (parentheses): (yeah), (echo), (crowd: ay!)."
    AppendLine P, "• Any noises/SFX go in bracketed asterisks: [* cheer *], [* breath *], [* bass drop *]."
    AppendLine P, "• The Style block is a single bracketed list of tags separated by pipes, e.g.: [anthemic rap | chant hook | evolving chorus | confident bounce]."
    AppendLine P, "• Exclude block is lowercase nouns, comma-separated."
    AppendLine P, "• Begin lyrics with: [Producer Tag] iMob Worldwide!"
    AppendLine P, "• 3+ minutes; evolving choruses; dense internals; stage cues in [brackets]; call-and-response via (parentheses)."
    AppendLine P, "• DO NOT reference instruments, production gear, BPM, 'two and four', mix/FX terms, or arrangement jargon unless explicitly asked."
    AppendLine P, "• Focus on human-centered premises and emotions (love/loyalty, heartbreak/healing, hustle/ambition, betrayal/trust, triumph/celebration, redemption/growth, city pride/belonging, struggle/perseverance)."
    AppendLine P, "• Keep phrasing conversational; avoid obscure slang unless requested."
    AppendLine P, "• Sanity-check: coherent POV/tense, plausible imagery, strong rhyme chains, natural idioms, on-beat phrasing."
    AppendLine P, ""

    If Len(gName) > 0 Then AppendLine P, "Chosen Genre (for feel only): " & gName
    If Len(gStyle) > 0 Then AppendLine P, "Use this exact Style block for Block 2: " & gStyle
    If Len(gExclude) > 0 Then AppendLine P, "Use this Exclude list for Block 3: " & LCase$(gExclude)
    AppendLine P, ""

    AppendLine P, "Guidance from my scoring sheet (for vibe; do NOT mention instruments/BPM in lyrics):"
    AppendLine P, "Feel: " & tempo
    AppendLine P, "Structure: " & structure
    AppendLine P, "Hook Plan: " & hookPlan
    AppendLine P, "Flow Plan: " & flowPlan
    AppendLine P, "Rhyme Plan: " & rhymePlan
    AppendLine P, "Style/Vibe: " & vibe
    AppendLine P, "Audience: " & audience
    AppendLine P, "Core Premise: " & premise
    AppendLine P, "Length target: " & IIf(Len(mins) > 0, mins & " minutes", "3–3.5 minutes")
    AppendLine P, ""
    AppendLine P, "Theme: " & IIf(Len(theme) > 0, theme, "(model pick)")
    AppendLine P, "Keywords to weave in: " & IIf(Len(keywords) > 0, keywords, "(model pick)")
    AppendLine P, "Must-include words/phrases (use naturally): " & IIf(Len(musts) > 0, musts, "(none)")
    AppendLine P, "Forbidden words/phrases: " & IIf(Len(forbids) > 0, forbids, "(none)")

    Dim locked() As String: locked = BuildLockedSections(src)
    If ArrAllocated(locked) Then
        AppendLine P, ""
        AppendLine P, "LOCKED SECTIONS (Use verbatim; only write missing parts):"
        Dim i As Long: For i = LBound(locked) To UBound(locked): AppendLine P, locked(i): Next i
    End If

    AppendLine P, ""
    AppendLine P, "If any rule is broken, fix and re-output without commentary."

    out.Range("A1").Value = "Copy this prompt into ChatGPT:"
    out.Range("A1").Font.Bold = True
    out.Range("A3").Value = Join(P, vbCrLf)
    out.Columns("A").ColumnWidth = 120
    out.Rows("3").WrapText = True
End Sub

Private Function BuildLockedSections(ws As Worksheet) As String()
    Dim res() As String
    Dim sects As Variant, tags As Variant, i As Long, txt As String
    sects = Array("Title idea", "Intro", "Hook / Chorus", "Verse 1", "Verse 2", "Bridge", "Outro")
    tags = Array("TITLE", "INTRO", "HOOK", "VERSE 1", "VERSE 2", "BRIDGE", "OUTRO")
    For i = LBound(sects) To UBound(sects)
        txt = Trim$(SectionText(ws, CStr(sects(i))))
        If Len(txt) > 0 Then
            AppendLine res, "[" & CStr(tags(i)) & "]"
            AppendLine res, CleanOneLine(txt)
        End If
    Next i
    BuildLockedSections = res
End Function

Private Sub BuildAISettingsSheet()
    Dim s As Worksheet
    On Error Resume Next: Set s = Worksheets("AI_Settings")
    On Error GoTo 0
    If s Is Nothing Then
        Set s = Worksheets.Add
        s.Name = "AI_Settings"
    Else
        s.Cells.Clear
    End If

    s.Range("A1").Value = "AI Settings": s.Range("A1").Font.Bold = True
    s.Range("A3").Resize(8, 2).Value = Array( _
        Array("Provider", "OpenAI-compatible"), _
        Array("Endpoint URL", "https://api.openai.com/v1/chat/completions"), _
        Array("Model", "gpt-4o-mini"), _
        Array("API Key (Bearer)", "sk-PASTE_YOUR_KEY_HERE"), _
        Array("Temperature (0-1.4)", 0.9), _
        Array("Max Tokens", 1200), _
        Array("System Prompt", "You are a lyrical assistant. Output only valid Suno blocks as instructed."), _
        Array("Safety Note", "Store keys securely. This sheet is not encrypted.") _
    )
    s.Columns("A:B").AutoFit
End Sub

Public Sub CallAIFromSheet()
    If Not SheetExistsRGF("AI_Settings") Then
        MsgBox "Run SetupAIPrompting first.", vbExclamation: Exit Sub
    End If
    If Not SheetExistsRGF("AI_Prompt") Then
        BuildPromptFromSheet
    End If

    Dim setWS As Worksheet: Set setWS = Worksheets("AI_Settings")
    Dim endpoint$, model$, apiKey$, systemP$
    Dim temp As Double, maxTok As Long
    endpoint = Trim$(CStr(setWS.Range("B4").Value))
    model = Trim$(CStr(setWS.Range("B5").Value))
    apiKey = Trim$(CStr(setWS.Range("B6").Value))
    temp = CDbl(Val(setWS.Range("B7").Value))
    maxTok = CLng(Val(setWS.Range("B8").Value))
    systemP = CStr(setWS.Range("B9").Value)

    If Len(apiKey) < 10 Then
        MsgBox "Missing API key in AI_Settings (B6).", vbExclamation: Exit Sub
    End If

    Dim prompt$: prompt = Worksheets("AI_Prompt").Range("A3").Value
    If Len(prompt) < 20 Then
        MsgBox "Prompt empty. Click 'Build Prompt' first.", vbExclamation: Exit Sub
    End If

    Dim req As Object, url$: url = endpoint
    On Error GoTo httpErr
    Set req = CreateObject("MSXML2.XMLHTTP")

    Dim body$: body = BuildChatJSON(model, systemP, prompt, temp, maxTok)
    req.Open "POST", url, False
    req.setRequestHeader "Content-Type", "application/json"
    req.setRequestHeader "Authorization", "Bearer " & apiKey
    req.Send body

    If req.Status < 200 Or req.Status >= 300 Then
        MsgBox "API error " & req.Status & ": " & req.responseText, vbCritical: Exit Sub
    End If

    Dim reply$: reply = ParseChatReply(req.responseText)
    If Not SheetExistsRGF("AI_Response") Then Worksheets.Add(After:=Worksheets("AI_Prompt")).Name = "AI_Response"
    With Worksheets("AI_Response")
        .Cells.Clear
        .Range("A1").Value = "AI Response (copy the four blocks into Suno):"
        .Range("A1").Font.Bold = True
        .Range("A3").Value = reply
        .Columns("A").ColumnWidth = 120
        .Rows("3").WrapText = True
        .Activate
    End With
    MsgBox "AI response written to 'AI_Response'.", vbInformation
    Exit Sub
httpErr:
    MsgBox "HTTP error: " & Err.Description, vbCritical
End Sub

Private Function BuildChatJSON(model As String, systemP As String, userPrompt As String, temp As Double, maxTok As Long) As String
    Dim j() As String
    AppendLine j, "{""model"":""" & JsonEscape(model) & """,""temperature"":" & CStr(temp) & ",""max_tokens"":" & CStr(maxTok) & ",""messages"":["
    AppendLine j, " {""role"":""system"",""content"":""" & JsonEscape(systemP) & """},"
    AppendLine j, " {""role"":""user"",""content"":""" & JsonEscape(userPrompt) & """}"
    AppendLine j, "]}"
    BuildChatJSON = Join(j, vbCrLf)
End Function

Private Function ParseChatReply(res As String) As String
    Dim startPos As Long, endPos As Long, s As String
    startPos = InStr(1, res, """content"":")
    If startPos = 0 Then ParseChatReply = res: Exit Function
    startPos = InStr(startPos + 10, res, """") + 1
    endPos = InStr(startPos, res, """")
    If endPos = 0 Then ParseChatReply = res: Exit Function
    s = Mid$(res, startPos, endPos - startPos)
    ParseChatReply = JsonUnescape(s)
End Function


'========================
' GENRE LIBRARY + UI
'========================
Public Sub BuildGenreLibrary()
    Dim ws As Worksheet, r As Long
    On Error Resume Next: Set ws = ThisWorkbook.Worksheets("Genre_Library"): On Error GoTo 0
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        ws.Name = "Genre_Library"
    Else
        ws.Cells.Clear
    End If

    ws.Range("A1:L1").Value = Array("Genre", "TempoHint", "StyleTags (comma list)", "StructureHint", "Exclude (comma)", "SFX (comma)", _
                                    "w_c Core", "w_t Tech", "w_a Anthem", "w_s Style", "w_g Group", "w_p Perf")
    ws.Rows(1).Font.Bold = True
    ws.Rows(1).Interior.Color = RGB(225, 235, 245)
    r = 2

    AddGenreRow ws, r, "Street Rap", "92–104 bpm feel", "anthemic rap, street imagery, internal rhymes, heavy 808s, chant hook, swagger", "Intro 2 → Hook 8 → Verse 16 → Hook 8 → Verse 16 → Hook 8", "edm, hyperpop, house", "crowd stomp, ad-lib yeah, tape stop", 0.27, 0.21, 0.16, 0.14, 0.14, 0.08
    AddGenreRow ws, r, "Drill", "138–146 bpm feel", "drill bounce, sliding 808s, triplet hats, gritty tone, call-and-response, dark minor", "Hook 8 → Verse 16 → Hook 8 → Verse 16 → Hook 8", "pop, country", "gun click, siren whoop, sub drop", 0.2, 0.24, 0.14, 0.12, 0.12, 0.18
    AddGenreRow ws, r, "Boom Bap", "86–94 bpm feel", "dusty drums, chopped samples, multis, punchlines, head-nod, swing", "Intro 4 → Verse 16 → Hook 8 → Verse 16 → Hook 8 → Outro 4", "edm, hyperpop", "vinyl crackle, dj scratch, crowd murmur", 0.22, 0.23, 0.14, 0.17, 0.14, 0.1
    AddGenreRow ws, r, "Club Rap", "100–110 bpm feel", "party chant, big claps, simple phrasing, catchy refrains, hyped ad-libs", "Intro 4 → Hook 8 → Verse 12 → Hook 8 → Verse 12 → Hook 8", "ballad, folk", "air horn, riser, whoosh", 0.21, 0.1, 0.28, 0.12, 0.12, 0.17
    AddGenreRow ws, r, "Trap Pop", "92–104 bpm feel", "melodic hook, modern trap kit, glossy synths, catchy top line, layered backs", "Intro 4 → Hook 8 → Verse 16 → Hook 8 → Verse 12 → Bridge 4 → Hook 8", "metal, punk", "riser, clap snare, vocal chop", 0.25, 0.14, 0.26, 0.12, 0.11, 0.12
    AddGenreRow ws, r, "R&B", "68–84 bpm feel", "silky vocals, harmonies, melisma hints, warm keys, intimate tone, late-night vibe", "Intro 2 → Verse 12 → Pre 4 → Hook 8 → Verse 12 → Pre 4 → Hook 8 → Outro 4", "metal, dnb", "breath, soft snap, reverse swell", 0.18, 0.1, 0.22, 0.16, 0.18, 0.16
    AddGenreRow ws, r, "Afrobeats", "98–108 bpm feel", "syncopated percussion, log drums, sunny melody, chantable hook, call-and-response", "Intro 4 → Hook 8 → Verse 16 → Hook 8 → Bridge 4 → Hook 8", "drill, metal", "shaker roll, crowd chant, whistle", 0.2, 0.11, 0.27, 0.12, 0.18, 0.12
    AddGenreRow ws, r, "Reggaeton", "88–100 bpm feel", "dembow groove, perreo energy, minor-key phrases, catchy refrains", "Intro 2 → Hook 8 → Verse 12 → Hook 8 → Verse 12 → Hook 8", "drill, metal", "air horn, riser, clap delay", 0.19, 0.14, 0.26, 0.12, 0.15, 0.14
    AddGenreRow ws, r, "House", "122–128 bpm feel", "four-on-the-floor, piano stabs, soulful hook, filter sweeps, long builds", "Intro 8 → Hook 16 → Break 8 → Hook 16 → Outro 8", "boom bap, country", "filter sweep, clap build, white noise", 0.16, 0.12, 0.26, 0.14, 0.12, 0.2
    AddGenreRow ws, r, "EDM (Big Room)", "126–130 bpm feel", "festival lead, huge drop, anthem chant, snares build, sidechain pump", "Intro 8 → Build 8 → Drop 16 → Break 8 → Build 8 → Drop 16", "boom bap, jazz", "snare roll, sweep up, sub impact", 0.14, 0.12, 0.3, 0.12, 0.1, 0.22
    AddGenreRow ws, r, "DnB", "170–176 bpm feel", "amen breaks, reese bass, fast top-lines, tension-release, rave stabs", "Intro 8 → Drop 16 → Breakdown 8 → Drop 16", "country, ballad", "risers, laser zap, whoosh", 0.18, 0.22, 0.16, 0.14, 0.12, 0.18
    AddGenreRow ws, r, "Pop", "100–120 bpm feel", "radio-friendly hook, concise imagery, memorable phrasing, clean stacks", "Verse 8 → Pre 4 → Hook 8 → Verse 8 → Pre 4 → Hook 8 → Bridge 4 → Hook 8", "metal, drill", "clap, riser, breath pop", 0.2, 0.1, 0.26, 0.16, 0.13, 0.15
    AddGenreRow ws, r, "Indie Pop", "98–112 bpm feel", "jangly guitars, airy synths, conversational tone, quirky images", "Intro 2 → Verse 12 → Hook 8 → Verse 12 → Hook 8 → Bridge 4 → Hook 8", "trap, drill", "tape hiss, tambourine, breath", 0.19, 0.14, 0.23, 0.18, 0.12, 0.14
    AddGenreRow ws, r, "Rock", "120–150 bpm feel", "driven guitars, shout-along hook, live kit energy, power chords", "Intro 4 → Verse 12 → Hook 8 → Verse 12 → Hook 8 → Bridge 8 → Hook 8", "edm, trap", "pick scrape, crowd whoa, cymbal swell", 0.24, 0.16, 0.18, 0.12, 0.12, 0.18
    AddGenreRow ws, r, "Metal", "140–190 bpm feel", "down-tuned riffs, double-kick, aggressive delivery, gang shouts", "Intro 4 → Verse 16 → Hook 8 → Verse 16 → Hook 8 → Breakdown 8 → Hook 8", "r&b, afrobeats", "china crash, pick scrape, growl", 0.2, 0.24, 0.12, 0.12, 0.12, 0.2
    AddGenreRow ws, r, "Country", "88–108 bpm feel", "story-first lyrics, twang, acoustic layers, big choruses", "Verse 12 → Pre 4 → Hook 8 → Verse 12 → Pre 4 → Hook 8 → Bridge 4 → Hook 8", "drill, edm", "slide guitar, crowd hey, clap", 0.18, 0.14, 0.22, 0.16, 0.18, 0.12
    AddGenreRow ws, r, "Folk", "70–95 bpm feel", "narrative lines, intimate vocal, acoustic textures, communal chorus", "Verse 16 → Hook 8 → Verse 16 → Hook 8 → Outro 4", "edm, drill", "breath, foot stomp, shaker", 0.18, 0.12, 0.2, 0.18, 0.2, 0.12
    AddGenreRow ws, r, "Jazz-Hop", "80–92 bpm feel", "jazz chords, swing pocket, soft kit, poetic bars, smoky mood", "Intro 4 → Verse 16 → Hook 8 → Verse 16 → Hook 8", "edm, metal", "sax lick, vinyl crackle, brush snare", 0.2, 0.18, 0.14, 0.2, 0.14, 0.14
    AddGenreRow ws, r, "Gospel Choir", "72–96 bpm feel", "uplift harmonies, call-and-response, claps, swell to big hook", "Verse 12 → Pre 4 → Hook 8 → Verse 12 → Pre 4 → Hook 8 → Modulate → Hook 8", "drill, metal", "choir swell, handclap, organ swell", 0.16, 0.1, 0.28, 0.12, 0.2, 0.14
    AddGenreRow ws, r, "Hyperpop", "140–170 bpm feel", "pitch play, glitchy chops, maximalist energy, bright hooks", "Hook 8 → Verse 8 → Hook 8 → Verse 8 → Hook 8", "boom bap, folk", "glitch zap, riser, vox chop", 0.12, 0.16, 0.26, 0.18, 0.12, 0.16

    ws.Columns("A:L").AutoFit
    ws.Columns("A:L").HorizontalAlignment = xlLeft

    Dim lastRow As Long: lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    ThisWorkbook.Names.Add Name:="GenreList", RefersTo:="=" & ws.Name & "!$A$2:$A$" & lastRow
End Sub

Private Sub AddGenreRow(ws As Worksheet, ByRef r As Long, _
    ByVal genre As String, ByVal tempo As String, ByVal tags As String, ByVal structureHint As String, _
    ByVal excludeCsv As String, ByVal sfxCsv As String, _
    ByVal wc As Double, ByVal wt As Double, ByVal wa As Double, ByVal ws_ As Double, ByVal wg As Double, ByVal wp As Double)
    ws.Cells(r, 1).Value = genre
    ws.Cells(r, 2).Value = tempo
    ws.Cells(r, 3).Value = tags
    ws.Cells(r, 4).Value = structureHint
    ws.Cells(r, 5).Value = excludeCsv
    ws.Cells(r, 6).Value = sfxCsv
    ws.Cells(r, 7).Value = wc: ws.Cells(r, 8).Value = wt: ws.Cells(r, 9).Value = wa
    ws.Cells(r, 10).Value = ws_: ws.Cells(r, 11).Value = wg: ws.Cells(r, 12).Value = wp
    r = r + 1
End Sub

Public Sub AddGenreControls()
    Dim main As Worksheet: Set main = Worksheets("RGF_Sheet")
    main.Range("E2").ClearContents
    With main.Range("E2").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:="=GenreList"
        .IgnoreBlank = True: .InCellDropdown = True
        .InputTitle = "Pick a genre"
        .InputMessage = "Choose from Genre_Library or add your own."
    End With
    main.Range("E2").Interior.Color = RGB(240, 255, 240)

    Dim x As Single, y As Single, w As Single, h As Single
    x = main.Columns("J").Left: w = 120: h = 24
    y = main.Rows(12).Top
    CreateButtonRGF main, x, y, w, h, "Open Genre Library", "OpenGenreLibrary", "btn_OpenGenreLib"
    CreateButtonRGF main, x + (w + 10), y, w, h, "Apply Genre", "ApplySelectedGenre", "btn_ApplyGenre"
End Sub

Public Sub OpenGenreLibrary()
    If SheetExistsRGF("Genre_Library") Then
        Worksheets("Genre_Library").Activate
    Else
        BuildGenreLibrary
        Worksheets("Genre_Library").Activate
    End If
End Sub

Public Sub ApplySelectedGenre()
    Dim main As Worksheet: Set main = Worksheets("RGF_Sheet")
    Dim g As String: g = Trim$(CStr(main.Range("E2").Value))
    If g = "" Then MsgBox "Pick a genre in E2 (dropdown).", vbInformation: Exit Sub
    If Not SheetExistsRGF("Genre_Library") Then MsgBox "Run BuildGenreLibrary first.", vbExclamation: Exit Sub

    Dim tempoHint$, structHint$, exclCsv$, styleBlock$
    Dim hasW As Boolean, wc#, wt#, wa#, ws_#, wg#, wp#
    If Not ReadCurrentGenre(styleBlock, tempoHint, structHint, exclCsv, hasW, wc, wt, wa, ws_, wg, wp) Then
        MsgBox "Genre '" & g & "' not found.", vbExclamation: Exit Sub
    End If

    main.Range("F1").Value = "Genre Applied": main.Range("F2").Value = g
    main.Range("E4").Value = "Style Block (preview)": main.Range("F4").Value = styleBlock
    main.Range("E6").Value = "Structure Hint": main.Range("F6").Value = structHint
    main.Range("E7").Value = "Exclude (preview)": main.Range("F7").Value = LCase$(exclCsv)
    main.Range("E8").Value = "SFX ideas": main.Range("F8").Value = ReadGenreField(GetGenreRow(g), 6)
    main.Range("F4").WrapText = True: main.Range("F4").ColumnWidth = 60

    If hasW Then
        If MsgBox("Apply '" & g & "' weight preset to C9:C14 now?", vbYesNo + vbQuestion, "Apply Genre Weights") = vbYes Then
            SetWeights wc, wt, wa, ws_, wg, wp
        End If
    End If
    MsgBox "Genre '" & g & "' applied. Suno and Prompt will reflect this.", vbInformation
End Sub

Public Function ReadCurrentGenre(ByRef styleBlock As String, ByRef tempoHint As String, _
                                 ByRef structureHint As String, ByRef excludeCsv As String, _
                                 Optional ByRef weightsFound As Boolean, _
                                 Optional ByRef wc As Double, Optional ByRef wt As Double, Optional ByRef wa As Double, _
                                 Optional ByRef ws_ As Double, Optional ByRef wg As Double, Optional ByRef wp As Double) As Boolean
    On Error GoTo nope
    Dim main As Worksheet: Set main = Worksheets("RGF_Sheet")
    Dim g As String: g = Trim$(CStr(main.Range("E2").Value))
    If g = "" Or Not SheetExistsRGF("Genre_Library") Then Exit Function

    Dim row As Long: row = GetGenreRow(g)
    If row = 0 Then Exit Function

    tempoHint = ReadGenreField(row, 2)
    Dim tagsCsv As String: tagsCsv = ReadGenreField(row, 3)
    structureHint = ReadGenreField(row, 4)
    excludeCsv = ReadGenreField(row, 5)

    wc = Val(ReadGenreField(row, 7)): wt = Val(ReadGenreField(row, 8))
    wa = Val(ReadGenreField(row, 9)): ws_ = Val(ReadGenreField(row, 10))
    wg = Val(ReadGenreField(row, 11)): wp = Val(ReadGenreField(row, 12))
    weightsFound = (wc + wt + wa + ws_ + wg + wp > 0)

    styleBlock = BuildStyleBlockFromGenre(tagsCsv, tempoHint)
    ReadCurrentGenre = True
    Exit Function
nope:
    ReadCurrentGenre = False
End Function

Private Function BuildStyleBlockFromGenre(ByVal tagsCsv As String, ByVal tempoHint As String) As String
    Dim arr As Variant, i As Long, cleaned As Collection, t$, flat$
    Set cleaned = New Collection
    arr = Split(tagsCsv, ",")
    For i = LBound(arr) To UBound(arr)
        t = Trim$(CStr(arr(i))): If Len(t) > 0 Then cleaned.Add t
    Next i
    If Len(Trim$(tempoHint)) > 0 Then cleaned.Add tempoHint
    For i = 1 To cleaned.Count
        If Len(flat) > 0 Then flat = flat & " | "
        flat = flat & cleaned(i)
    Next i
    BuildStyleBlockFromGenre = "[" & flat & "]"
End Function

Private Function GetGenreRow(ByVal genre As String) As Long
    Dim ws As Worksheet: Set ws = Worksheets("Genre_Library")
    Dim f As Range
    Set f = ws.Columns(1).Find(What:=genre, LookAt:=xlWhole, LookIn:=xlValues, MatchCase:=False)
    If Not f Is Nothing Then GetGenreRow = f.Row Else GetGenreRow = 0
End Function

Private Function ReadGenreField(row As Long, col As Long) As String
    ReadGenreField = CStr(Worksheets("Genre_Library").Cells(row, col).Value)
End Function

'========================
' DETERMINISTIC FALLBACKS (PREMISE-DRIVEN)
'========================
Private Function ResolvePremise() As String
    Dim ws As Worksheet: On Error Resume Next: Set ws = Worksheets("RGF_Sheet"): On Error GoTo 0
    Dim explicit$, theme$, kw$, aud$, pool As Variant, i&
    If ws Is Nothing Then ResolvePremise = "struggle & perseverance": Exit Function

    explicit = LCase$(Trim$(ws.Range("E10").Value))
    If explicit <> "" And explicit <> "(auto)" Then
        ResolvePremise = explicit: Exit Function
    End If

    theme = LCase$(Trim$(SectionText(ws, "Theme")))
    kw = LCase$(Trim$(SectionText(ws, "Keywords (comma-separated)")))
    aud = LCase$(Trim$(SectionText(ws, "Audience notes")))
    If InStr(theme & " " & kw & " " & aud, "love") > 0 Then ResolvePremise = "love & loyalty": Exit Function
    If InStr(theme & " " & kw & " " & aud, "heartbreak") > 0 Then ResolvePremise = "heartbreak & healing": Exit Function
    If InStr(theme & " " & kw & " " & aud, "hustle") > 0 Then ResolvePremise = "hustle & ambition": Exit Function
    If InStr(theme & " " & kw & " " & aud, "betray") > 0 Then ResolvePremise = "betrayal & trust": Exit Function
    If InStr(theme & " " & kw & " " & aud, "win") > 0 Or InStr(theme & " " & kw & " " & aud, "victory") > 0 Then ResolvePremise = "triumph & celebration": Exit Function
    If InStr(theme & " " & kw & " " & aud, "redemption") > 0 Or InStr(theme & " " & kw & " " & aud, "forgive") > 0 Then ResolvePremise = "redemption & growth": Exit Function
    If InStr(theme & " " & kw & " " & aud, "city") > 0 Or InStr(theme & " " & kw & " " & aud, "hometown") > 0 Then ResolvePremise = "city pride & belonging": Exit Function
    If InStr(theme & " " & kw & " " & aud, "grind") > 0 Or InStr(theme & " " & kw & " " & aud, "struggle") > 0 Then ResolvePremise = "struggle & perseverance": Exit Function

    pool = Array("love & loyalty", "heartbreak & healing", "hustle & ambition", "betrayal & trust", "triumph & celebration", "redemption & growth", "city pride & belonging", "struggle & perseverance")
    i = ((Minute(Now) + Second(Now)) Mod (UBound(pool) + 1))
    ResolvePremise = CStr(pool(i))
End Function

Private Function BuildIntro() As String()
    Dim a() As String, prem$: prem = ResolvePremise()
    AppendLine a, "[Intro]"
    Select Case prem
        Case "love & loyalty":            AppendLine a, "Kept it close when the world felt cold (you know).": AppendLine a, "(we still here) — what we hold, we won’t fold."
        Case "heartbreak & healing":      AppendLine a, "Took a hit to the heart, learned to breathe through the ache.": AppendLine a, "(slow deep breaths) — healing don’t rush, but it stays."
        Case "hustle & ambition":         AppendLine a, "Early light on my face, same promise I made.": AppendLine a, "(no days off) — what I said, I became."
        Case "betrayal & trust":          AppendLine a, "Saw the cracks in the circle, learned the names in the dust.": AppendLine a, "(lesson learned) — now the line is a must."
        Case "triumph & celebration":     AppendLine a, "Hands high for the wins we bled for.": AppendLine a, "(say it loud) — we ain’t going back poor."
        Case "redemption & growth":       AppendLine a, "Wrote wrongs into rights with a calm in my chest.": AppendLine a, "(step by step) — I’m answering my own test."
        Case "city pride & belonging":    AppendLine a, "Block by block, wrote my name in the cracks.": AppendLine a, "(we from here) — and we ain’t turning our backs."
        Case Else:                        AppendLine a, "Storm after storm, I learned how to stand.": AppendLine a, "(hold tight) — turn the weight into plans."
    End Select
    BuildIntro = a
End Function

Private Function BuildHook(SyncV As Double, GroupF As Double, Anthem As Double) As String()
    Dim a() As String, prem$: prem = ResolvePremise()
    AppendLine a, "[HOOK]"
    Select Case prem
        Case "love & loyalty"
            AppendLine a, "If I’m down, you lift — that’s us, no myth (yeah)."
            AppendLine a, "When the dark talk big, our bond don’t shift (nope)."
            AppendLine a, "(right now) say it — we don’t quit."
            AppendLine a, "Run it back, two hearts, one script."
        Case "heartbreak & healing"
            AppendLine a, "I broke, then I learned how to carry my name (carry my name)."
            AppendLine a, "Scars talk low but they point to the change (point to the change)."
            AppendLine a, "If pain call back, I don’t answer the same (nope)."
            AppendLine a, "I love me more — that’s the lane."
        Case "hustle & ambition"
            AppendLine a, "Clock say go, I’m already gone (already gone)."
            AppendLine a, "Talk stay cheap, my work is the song (work is the song)."
            AppendLine a, "Dreams got legs — watch how they run (watch how they run)."
            AppendLine a, "Bet on myself — that’s how it’s won."
        Case "betrayal & trust"
            AppendLine a, "Said you were here but you bent that truth (bent that truth)."
            AppendLine a, "Cut that cord — kept my roots (kept my roots)."
            AppendLine a, "Circle got small — that’s proof (that’s proof)."
            AppendLine a, "Trust gets earned, not couped."
        Case "triumph & celebration"
            AppendLine a, "Whole squad up — say cheers to the grind (cheers!)."
            AppendLine a, "Turn that doubt to a toast every time (clink)."
            AppendLine a, "Made that climb — now the view is the sign (look)."
            AppendLine a, "We the headline — underline."
        Case "redemption & growth"
            AppendLine a, "I forgave what I carried too long (too long)."
            AppendLine a, "Cut the chain, now I walk like a song (like a song)."
            AppendLine a, "New day, same me — more strong (more strong)."
            AppendLine a, "What I owe to my past — paid off."
        Case "city pride & belonging"
            AppendLine a, "Wave that flag where we claim our block (our block)."
            AppendLine a, "Every step say we can’t be stopped (can’t stop)."
            AppendLine a, "Name in the stone — set in the rock (in stone)."
            AppendLine a, "Home in my voice when I talk."
        Case Else
            AppendLine a, "Rain kept falling — I learned how to move (keep going)."
            AppendLine a, "Doubt kept calling — I hit reject, too (no thanks)."
            AppendLine a, "Road got rough — I made it a groove (bounce back)."
            AppendLine a, "Now every bruise is proof."
    End Select
    BuildHook = a
End Function

Private Function BuildHookEvolve(Anthem As Double, GroupF As Double) As String()
    Dim a() As String, prem$: prem = ResolvePremise()
    AppendLine a, "[HOOK – evolve]"
    Select Case prem
        Case "love & loyalty":            AppendLine a, "We hold this line when the world says fade (we don’t).": AppendLine a, "Promise on promise — all paid."
        Case "heartbreak & healing":      AppendLine a, "If tears come back, they just rinse the frame.": AppendLine a, "I see me clear — I keep that same."
        Case "hustle & ambition":         AppendLine a, "From plan to proof — that’s page by page.": AppendLine a, "My name on the door — not staged."
        Case "betrayal & trust":          AppendLine a, "I lock that gate for the peace I need.": AppendLine a, "The ones who stayed — that’s family."
        Case "triumph & celebration":     AppendLine a, "Another win, another lesson inside.": AppendLine a, "We don’t just rise — we rise with pride."
        Case "redemption & growth":       AppendLine a, "I own my story — chapters turn.": AppendLine a, "From ashes to bloom — let it burn."
        Case "city pride & belonging":    AppendLine a, "From streetlight glow to the porch I know.": AppendLine a, "My roots say stay — my dreams say go."
        Case Else:                        AppendLine a, "The heavy became the handle I hold.": AppendLine a, "I carry the weight like it’s gold."
    End Select
    BuildHookEvolve = a
End Function

Private Function BuildVerseDeterministic(Tech As Double, StyleSig As Double, vNum As Long) As String()
    Dim l() As String, bars As Long, i As Long, prem$: prem = ResolvePremise()
    If Tech >= 0.75 Then bars = 12 ElseIf Tech >= 0.6 Then bars = 10 Else bars = 8
    AppendLine l, "[Verse " & vNum & "]"
    For i = 1 To bars
        Select Case prem
            Case "love & loyalty":            AppendLine l, IIf(i Mod 2 = 1, "You held me down when the rumor got loud — I remember that.", "Every vow wasn’t typed, but we live it — that’s the better pact.")
            Case "heartbreak & healing":      AppendLine l, IIf(i Mod 2 = 1, "I kept a mirror I avoided — now I face it calm.", "I let the darkness write a verse — then I took the psalm.")
            Case "hustle & ambition":         AppendLine l, IIf(i Mod 2 = 1, "Made a list, crossed it out — now the list got long.", "I don’t chase what ain’t mine — I build my own.")
            Case "betrayal & trust":          AppendLine l, IIf(i Mod 2 = 1, "Close range cuts hurt deeper — I learned the cost.", "Trust is a gate with a code — some people lost.")
            Case "triumph & celebration":     AppendLine l, IIf(i Mod 2 = 1, "We made a toast to the nights that could’ve broke us quick.", "Now every step is a gift — we don’t trip on rich.")
            Case "redemption & growth":       AppendLine l, IIf(i Mod 2 = 1, "I wore my flaws like armor — then I learned to shed.", "Growth ain’t loud — it’s the quiet I kept instead.")
            Case "city pride & belonging":    AppendLine l, IIf(i Mod 2 = 1, "Corner store stories and names on the mail.", "Dreams fit better when they come with the trail.")
            Case Else:                        AppendLine l, IIf(i Mod 2 = 1, "Pressure made diamonds — it also made peace I earn.", "Every closed door was a hinge for a turn.")
        End Select
        If StyleSig >= 0.7 And (i Mod 3 = 0) Then AppendLine l, "(say it back) — we live what we learn."
    Next i
    BuildVerseDeterministic = l
End Function

Private Function BuildBridgeDeterministic(StyleSig As Double, GroupF As Double) As String()
    Dim a() As String, prem$: prem = ResolvePremise()
    If StyleSig < 0.55 Then Exit Function
    AppendLine a, "[Bridge]"
    Select Case prem
        Case "love & loyalty":            AppendLine a, "If the crowd goes quiet — you can hear our proof.": AppendLine a, "(it’s us) — no need for the boost."
        Case "heartbreak & healing":      AppendLine a, "I stitched what tore — not to hide the seam.": AppendLine a, "(look close) — those lines still gleam."
        Case "hustle & ambition":         AppendLine a, "Tomorrow don’t start if I’m stuck on last.": AppendLine a, "(move now) — make the future fast."
        Case "betrayal & trust":          AppendLine a, "Kept my circle honest, let the edges fade.": AppendLine a, "(stand close) — trust is made."
        Case "triumph & celebration":     AppendLine a, "We don’t just dance — we remember why.": AppendLine a, "(hands up) — we survived."
        Case "redemption & growth":       AppendLine a, "I forgave my old self, let a new one rise.": AppendLine a, "(breathe in) — open skies."
        Case "city pride & belonging":    AppendLine a, "Street names hum like a family hymn.": AppendLine a, "(sing back) — that’s our kin."
        Case Else:                        AppendLine a, "If pain is a teacher, I’m ahead in class.": AppendLine a, "(eyes up) — I will pass."
    End Select
    BuildBridgeDeterministic = a
End Function

Private Function BuildOutroDeterministic() As String()
    Dim a() As String, prem$: prem = ResolvePremise()
    AppendLine a, "[Outro]"
    Select Case prem
        Case "love & loyalty":            AppendLine a, "When the lights cut low, we still glow — that’s trust.": AppendLine a, "(til the end) — it’s us."
        Case "heartbreak & healing":      AppendLine a, "What was heavy ain’t gone — it just don’t own me.": AppendLine a, "(I’m whole) — let it be."
        Case "hustle & ambition":         AppendLine a, "Day done, but the proof stays loud in the book.": AppendLine a, "(sign it) — take a look."
        Case "betrayal & trust":          AppendLine a, "I keep my peace where the true ones meet.": AppendLine a, "(head high) — steady feet."
        Case "triumph & celebration":     AppendLine a, "Write our names where the victory lives.": AppendLine a, "(one more time) — we did."
        Case "redemption & growth":       AppendLine a, "I’m not who I was — and that’s the art.": AppendLine a, "(breathe out) — brand new start."
        Case "city pride & belonging":    AppendLine a, "Home ain’t a place — it’s the echo we keep.": AppendLine a, "(good night) — sleep deep."
        Case Else:                        AppendLine a, "If tomorrow’s a hill — I’m already mid-climb.": AppendLine a, "(no fear) — I got time."
    End Select
    BuildOutroDeterministic = a
End Function

'========================
' UTILITIES
'========================
Private Function SheetExistsRGF(Name As String) As Boolean
    On Error Resume Next
    SheetExistsRGF = Not Worksheets(Name) Is Nothing
    On Error GoTo 0
End Function

Private Sub AddRow(ws As Worksheet, ByRef r As Long, s As String, lbl As String, val As String)
    ws.Cells(r, 1).Value = s
    ws.Cells(r, 2).Value = lbl
    If Len(val) > 0 And Left$(val, 1) = "=" Then
        ws.Cells(r, 3).Formula = val
    ElseIf Len(val) > 0 Then
        ws.Cells(r, 3).Value = val
    End If
    r = r + 1
End Sub

Private Sub ColorBySection(ws As Worksheet)
    Dim lr As Long, i As Long
    lr = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    For i = 2 To lr
        With ws.Range(ws.Cells(i, 1), ws.Cells(i, 3)).Interior
            Select Case ws.Cells(i, 1).Value
                Case "Constants", "Controls", "Weights": .Color = RGB(230, 242, 255)
                Case "Base Inputs (0–10)": .Color = RGB(226, 239, 218)
                Case "Derived Inputs": .Color = RGB(255, 242, 204)
                Case "Normalized", "Helper", "BLOCKS": .Color = RGB(248, 229, 214)
                Case "FINAL": .Color = RGB(255, 204, 204)
                Case Else: .ColorIndex = xlColorIndexNone
            End Select
        End With
    Next i
End Sub

Private Sub AddScoreBands(ws As Worksheet)
    With ws.Range("C60").FormatConditions
        .Delete
        .AddColorScale ColorScaleType:=3
        With .Item(1)
            .ColorScaleCriteria(1).Type = xlConditionValueNumber
            .ColorScaleCriteria(1).Value = 0
            .ColorScaleCriteria(1).FormatColor.Color = RGB(255, 102, 102)
            .ColorScaleCriteria(2).Type = xlConditionValueNumber
            .ColorScaleCriteria(2).Value = 70
            .ColorScaleCriteria(2).FormatColor.Color = RGB(255, 230, 153)
            .ColorScaleCriteria(3).Type = xlConditionValueNumber
            .ColorScaleCriteria(3).Value = 90
            .ColorScaleCriteria(3).FormatColor.Color = RGB(144, 238, 144)
        End With
    End With
End Sub

Private Sub AddDV(rng As Range, ttl As String, msg As String, minVal As Double, maxVal As Double)
    On Error Resume Next
    rng.Validation.Delete
    rng.Validation.Add Type:=xlValidateDecimal, AlertStyle:=xlValidAlertInformation, _
        Operator:=xlBetween, Formula1:=CStr(minVal), Formula2:=CStr(maxVal)
    rng.Validation.InputTitle = ttl
    rng.Validation.InputMessage = msg
    On Error GoTo 0
End Sub

Private Function NzD(ByVal v As Variant, Optional ByVal defaultVal As Double = 0#) As Double
    If IsError(v) Or IsEmpty(v) Or v = "" Then NzD = defaultVal Else NzD = CDbl(v)
End Function

Private Sub AppendLine(ByRef arr() As String, ByVal txt As String)
    Dim lb As Long, ub As Long
    If ArrAllocated(arr) Then
        lb = LBound(arr): ub = UBound(arr)
        ReDim Preserve arr(lb To ub + 1)
        arr(ub + 1) = txt
    Else
        ReDim arr(0 To 0)
        arr(0) = txt
    End If
End Sub

Private Sub AppendBlock(ByRef acc() As String, block() As String)
    Dim i As Long, ln As String
    If ArrAllocated(block) Then
        For i = LBound(block) To UBound(block)
            ln = Trim$(block(i))
            If Len(ln) > 0 Then
                ln = NormalizeMetaTag(ln)
                AppendLine acc, ln
            End If
        Next i
    End If
End Sub

Private Function ArrAllocated(ByRef a As Variant) As Boolean
    On Error GoTo notalloc
    If Not IsArray(a) Then GoTo notalloc
    Dim lb As Long, ub As Long: lb = LBound(a): ub = UBound(a)
    ArrAllocated = (ub >= lb): Exit Function
notalloc:
    ArrAllocated = False
End Function
Private Function JsonEscape(ByVal s As String) As String
    s = Replace(s, "\", "\\")
    s = Replace(s, """", "\"")
    s = Replace(s, vbCrLf, "\n")
    s = Replace(s, vbLf, "\n")
    s = Replace(s, vbCr, "\n")
    JsonEscape = s
End Function

Private Function JsonUnescape(ByVal s As String) As String
    s = Replace(s, "\n", vbCrLf)
    s = Replace(s, "\""", """")
    s = Replace(s, "\\", "\")
    JsonUnescape = s
End Function


Private Function FindLabelRow(ws As Worksheet, ByVal labelText As String) As Long
    Dim f As Range
    Set f = ws.Columns(1).Find(What:=labelText, LookAt:=xlWhole, LookIn:=xlValues, MatchCase:=False)
    If Not f Is Nothing Then FindLabelRow = f.Row Else FindLabelRow = ws.Range("A1").Row
End Function

Private Function SectionText(ws As Worksheet, ByVal labelText As String) As String
    Dim r As Long: r = FindLabelRow(ws, labelText)
    SectionText = CStr(ws.Cells(r, "C").Value)
End Function

Private Sub AppendLinesFromCell(ByRef acc() As String, ByVal cellText As String)
    Dim t As String: t = Replace(cellText, vbCrLf, vbLf)
    Dim arr As Variant: arr = Split(t, vbLf)
    Dim i As Long, ln As String
    For i = LBound(arr) To UBound(arr)
        ln = Trim$(arr(i))
        If Len(ln) > 0 Then
            ln = NormalizeMetaTag(ln)
            AppendLine acc, ln
        End If
    Next i
End Sub

Private Sub AppendBlockOrGenerated(ByRef acc() As String, ws As Worksheet, ByVal labelText As String, ByVal gen() As String)
    Dim txt As String: txt = SectionText(ws, labelText)
    If Len(Trim$(txt)) > 0 Then
        Dim header As String: header = UCase$(labelText)
        If header = "HOOK / CHORUS" Then header = "HOOK"
        AppendLine acc, "[" & ProperHeader(header) & "]"
        AppendLinesFromCell acc, txt
    Else
        AppendBlock acc, gen
    End If
End Sub

Private Function ProperHeader(ByVal s As String) As String
    Select Case UCase$(s)
        Case "INTRO": ProperHeader = "Intro"
        Case "HOOK", "HOOK / CHORUS": ProperHeader = "HOOK"
        Case "VERSE 1": ProperHeader = "Verse 1"
        Case "VERSE 2": ProperHeader = "Verse 2"
        Case "BRIDGE": ProperHeader = "Bridge"
        Case "OUTRO": ProperHeader = "Outro"
        Case Else: ProperHeader = s
    End Select
End Function

Private Function FirstNonEmpty(ParamArray s() As Variant) As String
    Dim i As Long
    For i = LBound(s) To UBound(s)
        If Len(Trim$(CStr(s(i)))) > 0 Then FirstNonEmpty = CStr(s(i)): Exit Function
    Next i
    FirstNonEmpty = ""
End Function

Private Function CleanOneLine(ByVal s As String) As String
    s = Replace(s, vbCrLf, " / ")
    s = Replace(s, vbLf, " / ")
    CleanOneLine = Trim$(s)
End Function

' ---------- TAG NORMALIZATION ----------
Private Function ReplaceCI(ByVal s As String, ByVal findText As String, ByVal replText As String) As String
    Dim P As Long, fl As Long, tl As Long
    fl = Len(findText): tl = Len(s): P = 1
    Do While P <= tl - fl + 1
        If LCase$(Mid$(s, P, fl)) = LCase$(findText) Then
            s = Left$(s, P - 1) & replText & Mid$(s, P + fl)
            tl = Len(s): P = P + Len(replText)
        Else
            P = P + 1
        End If
    Loop
    ReplaceCI = s
End Function

Private Function NormalizeMetaTag(ByVal line As String) As String
    Dim s As String: s = Trim$(line)
    If s = "" Then NormalizeMetaTag = s: Exit Function

    ' Already bracketed tag (including [* *])
    If Left$(s, 1) = "[" And InStr(s, "]") > 0 Then NormalizeMetaTag = s: Exit Function

    ' Cues to tags
    s = ReplaceCI(s, "(chant)", "[Chant]")
    s = ReplaceCI(s, "chant:", "[Chant]")
    s = ReplaceCI(s, "( gang vox )", "[Gang Vox]")
    s = ReplaceCI(s, "gang vox:", "[Gang Vox]")
    s = ReplaceCI(s, "gang  vox:", "[Gang Vox]")
    s = ReplaceCI(s, "(gang vox)", "[Gang Vox]")

    s = ReplaceCI(s, "(delay hit hard)", "[delay hits hard]")
    s = ReplaceCI(s, "(delay hits hard)", "[delay hits hard]")
    s = ReplaceCI(s, "delay hit hard:", "[delay hits hard]")
    s = ReplaceCI(s, "delay hits hard:", "[delay hits hard]")

    ' Naked headers
    Dim hdrs As Variant, i As Long
    hdrs = Array("intro", "hook – reprise", "hook - reprise", "hook", "verse 1", "verse 2", "bridge", "outro")
    For i = LBound(hdrs) To UBound(hdrs)
        If LCase$(Left$(s, Len(hdrs(i)))) = LCase$(hdrs(i)) Then
            s = "[" & Application.WorksheetFunction.Proper(hdrs(i)) & "]" & Mid$(s, Len(hdrs(i)) + 1)
            NormalizeMetaTag = s: Exit Function
        End If
    Next i

    ' SFX/noises prefixes -> [*  *]
    Dim P As Long
    P = InStr(1, s, "sfx:", vbTextCompare):    If P = 1 Then s = "[* " & Trim$(Mid$(s, P + 4)) & " *]"
    P = InStr(1, s, "noise:", vbTextCompare):  If P = 1 Then s = "[* " & Trim$(Mid$(s, P + 6)) & " *]"
    P = InStr(1, s, "fx:", vbTextCompare):     If P = 1 Then s = "[* " & Trim$(Mid$(s, P + 3)) & " *]"

    NormalizeMetaTag = s
End Function

Private Function NormalizeStyleTagsFromList(ParamArray items() As Variant) As String
    Dim flat As String, i As Long, t As String
    For i = LBound(items) To UBound(items)
        t = Trim$(CStr(items(i)))
        If Len(t) > 0 Then
            If Len(flat) > 0 Then flat = flat & " | "
            flat = flat & t
        End If
    Next i
    NormalizeStyleTagsFromList = "[" & flat & "]"
End Function

'========================
' ONE-CLICK SETUP
'========================
Public Sub RGF_OneClickSetup()
    On Error GoTo failfast
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.DisplayStatusBar = True
    Application.StatusBar = "RGF: building main sheet…"

    BuildRGFSheet

    Application.StatusBar = "RGF: building genre library…"
    BuildGenreLibrary
    AddGenreControls

    Application.StatusBar = "RGF: help + action buttons…"
    BuildHelpSheet
    AddBriefAndSunoButtons

    Application.StatusBar = "RGF: AI prompt workspace…"
    SetupAIPrompting

    Worksheets("RGF_Sheet").Activate
    Range("A1").Select
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    MsgBox "RGF is ready. Pick a Genre in E2 and a Premise in E10 (or '(auto)'), adjust inputs/weights, then click 'Make Brief' or 'Make Suno'.", vbInformation, "RGF Setup Complete"
    Exit Sub
failfast:
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    MsgBox "Setup error: " & Err.Description, vbCritical, "RGF One-Click Setup"
End Sub

Public Sub RGF_RebuildPreservingGenres()
    On Error Resume Next
    Dim hadGenres As Boolean: hadGenres = Not Worksheets("Genre_Library") Is Nothing
    On Error GoTo 0

    If Not hadGenres Then
        RGF_OneClickSetup
        Exit Sub
    End If

    Dim glib As Worksheet, tmp As Worksheet
    Set glib = Worksheets("Genre_Library")
    glib.Copy After:=glib
    Set tmp = ActiveSheet
    tmp.Name = "Genre_Library_BACKUP"

    RGF_OneClickSetup

    If MsgBox("Restore your previous Genre_Library over the freshly built one?", vbYesNo + vbQuestion, "Restore Genres") = vbYes Then
        Application.ScreenUpdating = False
        Worksheets("Genre_Library").Cells.Clear
        tmp.Cells.Copy Worksheets("Genre_Library").Range("A1")
        Application.ScreenUpdating = True
        MsgBox "Genres restored. (Backup sheet left in workbook: Genre_Library_BACKUP)", vbInformation
    End If
End Sub

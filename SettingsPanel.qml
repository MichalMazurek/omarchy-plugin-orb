import QtQuick
import qs.Commons as Commons
import qs.Ui

FocusScope {
    id: panel
    property int diameter: 240
    property bool animation: true
    property var actions: []
    property var original: ({})
    property var choices: []
    property var appLibrary: null
    property string shortcut: ""
    property string error: ""
    property bool busy: false
    property int tab: 0
    property int cursor: 2
    property int editingSlot: -1
    property int pickerCursor: 0
    readonly property var positions: ["Top", "Upper right", "Lower right", "Bottom", "Lower left", "Upper left"]
    readonly property var filteredChoices: choices.filter(function(row) {
        return (row.title + " " + row.detail).toLowerCase().indexOf(search.text.trim().toLowerCase()) >= 0;
    })
    readonly property int controlCount: tab === 0 ? 10 : 6
    signal saveRequested()
    signal canceled()
    implicitHeight: content.height + Commons.Style.space(36)
    height: implicitHeight

    function begin(config, catalog) {
        original = JSON.parse(JSON.stringify(config));
        diameter = config.diameter; animation = config.animation;
        actions = JSON.parse(JSON.stringify(config.actions)); choices = catalog;
        tab = 0; cursor = 2; editingSlot = -1; search.text = "";
        search.focus = false; navigation.focus = true;
    }
    function draft() { return { diameter: diameter, animation: animation, actions: actions }; }
    function appIcon(action) {
        if (!action.desktopId) return "";
        for (var i = 0; i < choices.length; i++)
            if (choices[i].action.desktopId === action.desktopId) return choices[i].iconSource || "";
        return "";
    }
    function adjust(delta) { diameter = Math.max(220, Math.min(600, diameter + delta)); }
    function editSlot(index) {
        if (busy) return;
        editingSlot = index; pickerCursor = 0; search.text = "";
        Qt.callLater(function() { search.forceActiveFocus(); });
    }
    function backToSlots() {
        cursor = editingSlot + 2; editingSlot = -1;
        search.focus = false; navigation.forceActiveFocus();
    }
    function choose(index) {
        if (busy || editingSlot < 0 || index < 0 || index >= filteredChoices.length) return;
        var copy = actions.slice();
        copy[editingSlot] = JSON.parse(JSON.stringify(filteredChoices[index].action));
        actions = copy; backToSlots();
    }
    function movePicker(delta) {
        if (!filteredChoices.length) return;
        pickerCursor = (pickerCursor + delta + filteredChoices.length) % filteredChoices.length;
        choiceList.positionViewAtIndex(pickerCursor, ListView.Contain);
    }
    function activateControl() {
        if (cursor < 2) { tab = cursor; cursor = 2; }
        else if (tab === 0 && cursor < 8) editSlot(cursor - 2);
        else if (tab === 1 && cursor === 3) animation = !animation;
        else if (cursor === controlCount - 2) canceled();
        else if (cursor === controlCount - 1) saveRequested();
    }
    // Keep a real navigation focus target: forcing focus on the scope alone
    // would return it to the hidden search field after leaving the picker.
    Item { id: navigation; focus: true }
    Keys.onPressed: event => {
        if (panel.busy) { event.accepted = true; return; }
        if (event.key === Qt.Key_Escape) {
            if (panel.editingSlot >= 0) panel.backToSlots(); else panel.canceled();
        } else if (panel.editingSlot >= 0) {
            if (event.key === Qt.Key_Down) panel.movePicker(1);
            else if (event.key === Qt.Key_Up) panel.movePicker(-1);
            else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) panel.choose(panel.pickerCursor);
            else return;
        } else if (event.key === Qt.Key_Tab || event.key === Qt.Key_Backtab || event.key === Qt.Key_Down || event.key === Qt.Key_Up) {
            var back = event.key === Qt.Key_Backtab || event.key === Qt.Key_Up || (event.key === Qt.Key_Tab && (event.modifiers & Qt.ShiftModifier));
            panel.cursor = (panel.cursor + (back ? panel.controlCount - 1 : 1)) % panel.controlCount;
        } else if (panel.tab === 1 && panel.cursor === 2 && (event.key === Qt.Key_Left || event.key === Qt.Key_Right)) panel.adjust(event.key === Qt.Key_Right ? 10 : -10);
        else if (event.key === Qt.Key_S && (event.modifiers & Qt.ControlModifier)) panel.saveRequested();
        else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) panel.activateControl();
        else return;
        event.accepted = true;
    }

    component Label: Text {
        textFormat: Text.PlainText
        color: Commons.Color.menu.text
        font.family: Commons.Style.font.menuFamily
        font.pixelSize: Commons.Style.space(12)
        elide: Text.ElideRight
    }
    component ChoiceRow: Rectangle {
        id: row
        property string title: ""
        property string detail: ""
        property string iconName: "app"
        property url iconSource: ""
        property string number: ""
        property bool chosen: false
        signal clicked()
        height: Commons.Style.space(42)
        radius: Commons.Style.cornerRadius
        color: Commons.Util.alpha(Commons.Color.menu.text, mouse.containsMouse || chosen ? 0.09 : 0.025)
        border.width: chosen ? 1 : 0
        border.color: Commons.Color.accent
        Label {
            x: Commons.Style.space(9); anchors.verticalCenter: parent.verticalCenter
            visible: row.number !== ""; text: row.number
            color: Commons.Util.alpha(Commons.Color.menu.text, 0.5)
            font.pixelSize: Commons.Style.space(10)
        }
        ActionIcon {
            x: Commons.Style.space(row.number ? 25 : 10); anchors.verticalCenter: parent.verticalCenter
            width: Commons.Style.space(21); height: width
            name: row.iconName; appSource: row.iconSource
            ink: row.chosen ? Commons.Color.accent : Commons.Color.menu.text
        }
        Column {
            x: Commons.Style.space(row.number ? 57 : 42); anchors.verticalCenter: parent.verticalCenter
            width: parent.width - x - Commons.Style.space(25); spacing: 2
            Label { width: parent.width; text: row.title }
            Label {
                width: parent.width; text: row.detail; font.pixelSize: Commons.Style.space(9)
                color: Commons.Util.alpha(Commons.Color.menu.text, 0.55)
            }
        }
        Label { anchors.right: parent.right; anchors.rightMargin: 12; anchors.verticalCenter: parent.verticalCenter; text: "›"; color: Commons.Color.accent }
        MouseArea { id: mouse; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; enabled: !panel.busy; onClicked: row.clicked() }
    }

    Rectangle {
        anchors.fill: parent; radius: Commons.Style.cornerRadius
        color: Commons.Color.menu.background
        border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.25)
        MouseArea { anchors.fill: parent; acceptedButtons: Qt.AllButtons; onClicked: panel.forceActiveFocus() }
    }
    Column {
        id: content
        x: Commons.Style.space(18); y: x
        width: parent.width - x * 2; spacing: Commons.Style.space(10)
        Label {
            width: parent.width
            text: panel.editingSlot >= 0 ? "Choose slot " + (panel.editingSlot + 1) : "Orb settings"
            font.pixelSize: Commons.Style.space(18); font.weight: Font.DemiBold
        }
        Label {
            width: parent.width
            text: panel.editingSlot >= 0 ? panel.positions[panel.editingSlot] + " · " + panel.actions[panel.editingSlot].label
                : "Your shortcuts, in your orbit."
            font.pixelSize: Commons.Style.space(11); color: Commons.Util.alpha(Commons.Color.menu.text, 0.6)
        }
        Row {
            visible: panel.editingSlot < 0
            width: parent.width; spacing: Commons.Style.space(6)
            Repeater {
                model: ["Slots", "Appearance"]
                delegate: Button {
                    required property int index
                    required property string modelData
                    width: (content.width - parent.spacing) / 2
                    text: modelData; selected: panel.tab === index; hasCursor: panel.cursor === index
                    bordered: true; foreground: Commons.Color.menu.text; fontFamily: Commons.Style.font.menuFamily
                    enabled: !panel.busy
                    onClicked: { panel.tab = index; panel.cursor = 2; panel.forceActiveFocus(); }
                }
            }
        }
        Column {
            visible: panel.editingSlot < 0 && panel.tab === 0
            width: parent.width; spacing: Commons.Style.space(4)
            Repeater {
                model: panel.actions
                delegate: ChoiceRow {
                    required property int index
                    required property var modelData
                    width: content.width; number: String(index + 1)
                    title: modelData.label; detail: panel.positions[index]
                    iconName: modelData.icon; iconSource: panel.appIcon(modelData); chosen: panel.cursor === index + 2
                    onClicked: panel.editSlot(index)
                }
            }
        }
        Column {
            visible: panel.editingSlot < 0 && panel.tab === 1
            width: parent.width; spacing: Commons.Style.space(12)
            Label { text: "Wheel size · " + Math.round(Commons.Style.space(panel.diameter)) + " px" }
            Item {
                width: parent.width; height: Commons.Style.space(30)
                Rectangle {
                    anchors.fill: parent; anchors.margins: -3; radius: Commons.Style.cornerRadius
                    color: "transparent"; border.width: panel.cursor === 2 ? 1 : 0; border.color: Commons.Color.accent
                }
                PanelSlider {
                    anchors.fill: parent; enabled: !panel.busy
                    minimum: 220; maximum: 600; step: 10; integer: true; value: panel.diameter
                    trackColor: Commons.Util.alpha(Commons.Color.menu.text, 0.15)
                    fillColor: Commons.Color.accent; knobColor: Commons.Color.accent
                    onMoved: value => { panel.diameter = Math.round(value / 10) * 10; panel.cursor = 2; panel.forceActiveFocus(); }
                }
            }
            Item {
                width: parent.width; height: Commons.Style.space(40)
                Label { anchors.left: parent.left; anchors.verticalCenter: parent.verticalCenter; text: "Opening animation" }
                ToggleSwitch {
                    anchors.right: parent.right; anchors.verticalCenter: parent.verticalCenter
                    checked: panel.animation; busy: panel.busy; hasCursor: panel.cursor === 3; foreground: Commons.Color.menu.text
                    onToggled: { panel.animation = !panel.animation; panel.cursor = 3; panel.forceActiveFocus(); }
                }
            }
            Label {
                width: parent.width; text: "Open with " + panel.shortcut
                font.pixelSize: Commons.Style.space(11); color: Commons.Util.alpha(Commons.Color.menu.text, 0.6)
            }
        }
        Column {
            visible: panel.editingSlot >= 0
            width: parent.width; spacing: Commons.Style.space(8)
            TextField {
                id: search
                width: parent.width; placeholderText: "Search apps and shortcuts…"; enabled: !panel.busy
                onTextChanged: { panel.pickerCursor = 0; choiceList.positionViewAtBeginning(); }
                // Consume Enter before TextField's accepted signal can bubble
                // the same key into the newly focused slot-list navigation.
                Keys.onReturnPressed: event => { panel.choose(panel.pickerCursor); event.accepted = true; }
                Keys.onEnterPressed: event => { panel.choose(panel.pickerCursor); event.accepted = true; }
                Keys.onDownPressed: panel.movePicker(1)
                Keys.onUpPressed: panel.movePicker(-1)
                Keys.onEscapePressed: panel.backToSlots()
            }
            ListView {
                id: choiceList
                width: parent.width; height: Commons.Style.space(252)
                clip: true; spacing: Commons.Style.space(4); boundsBehavior: Flickable.StopAtBounds
                model: panel.filteredChoices
                delegate: ChoiceRow {
                    required property int index
                    required property var modelData
                    width: choiceList.width; title: modelData.title; detail: modelData.detail
                    iconName: modelData.action.icon; iconSource: modelData.iconSource || ""
                    chosen: index === panel.pickerCursor
                    onClicked: panel.choose(index)
                }
                Label { anchors.centerIn: parent; visible: choiceList.count === 0; text: "No matching apps or shortcuts"; font.pixelSize: Commons.Style.space(11) }
            }
            Button {
                width: parent.width; text: "‹ Back to slots"; bordered: true
                foreground: Commons.Color.menu.text; fontFamily: Commons.Style.font.menuFamily
                onClicked: panel.backToSlots()
            }
        }
        Label {
            visible: panel.error !== ""; width: parent.width; text: panel.error
            elide: Text.ElideNone; wrapMode: Text.WordWrap; color: Commons.Color.urgent
            font.pixelSize: Commons.Style.space(11)
        }
        Row {
            visible: panel.editingSlot < 0
            width: parent.width; spacing: Commons.Style.space(8)
            Button {
                width: (parent.width - parent.spacing) / 2
                text: "Cancel"; bordered: true; hasCursor: panel.cursor === panel.controlCount - 2
                foreground: Commons.Color.menu.text; fontFamily: Commons.Style.font.menuFamily; enabled: !panel.busy
                onClicked: panel.canceled()
            }
            Button {
                width: (parent.width - parent.spacing) / 2
                text: panel.busy ? "Saving…" : "Save"; bordered: true; selected: true; hasCursor: panel.cursor === panel.controlCount - 1
                enabled: !panel.busy; foreground: Commons.Color.menu.text; fontFamily: Commons.Style.font.menuFamily
                onClicked: panel.saveRequested()
            }
        }
    }
}

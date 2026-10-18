import QtQuick
import qs.Commons as Commons
import qs.Ui

FocusScope {
    id: panel
    property int diameter: 240
    property bool animation: true
    property string shortcut: ""
    property string error: ""
    property bool busy: false
    property int cursor: 0
    signal saveRequested()
    signal canceled()
    implicitHeight: content.height + Commons.Style.space(36)
    height: implicitHeight

    function begin(size, animate) {
        diameter = size; animation = animate; cursor = 0;
    }
    function adjust(delta) { diameter = Math.max(220, Math.min(600, diameter + delta)); }
    Keys.onPressed: event => {
        if (event.key === Qt.Key_Escape) panel.canceled();
        else if (panel.busy) { event.accepted = true; return; }
        else if (event.key === Qt.Key_Tab || event.key === Qt.Key_Backtab || event.key === Qt.Key_Down || event.key === Qt.Key_Up) {
            var back = event.key === Qt.Key_Backtab || event.key === Qt.Key_Up || (event.key === Qt.Key_Tab && (event.modifiers & Qt.ShiftModifier));
            panel.cursor = (panel.cursor + (back ? 3 : 1)) % 4;
        } else if (panel.cursor === 0 && (event.key === Qt.Key_Left || event.key === Qt.Key_Right)) panel.adjust(event.key === Qt.Key_Right ? 10 : -10);
        else if (event.key === Qt.Key_S && (event.modifiers & Qt.ControlModifier)) panel.saveRequested();
        else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) {
            if (panel.cursor === 1) panel.animation = !panel.animation;
            else if (panel.cursor === 2) panel.canceled();
            else if (panel.cursor === 3) panel.saveRequested();
        } else return;
        event.accepted = true;
    }

    Rectangle {
        anchors.fill: parent
        radius: Commons.Style.cornerRadius
        color: Commons.Color.menu.background
        border.width: 1
        border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.25)
        MouseArea { anchors.fill: parent; acceptedButtons: Qt.AllButtons; onClicked: panel.forceActiveFocus() }
    }
    Column {
        id: content
        x: Commons.Style.space(18); y: x
        width: parent.width - x * 2
        spacing: Commons.Style.space(12)
        Column {
            width: parent.width; spacing: 5
            Text {
                text: "Orb settings"; textFormat: Text.PlainText
                color: Commons.Color.menu.text
                font.family: Commons.Style.font.menuFamily
                font.pixelSize: Commons.Style.space(18); font.weight: Font.DemiBold
            }
            Text {
                text: "A little more your size."; textFormat: Text.PlainText
                color: Commons.Util.alpha(Commons.Color.menu.text, 0.65)
                font.family: Commons.Style.font.menuFamily; font.pixelSize: Commons.Style.space(11)
            }
        }
        Item {
            width: parent.width; height: Commons.Style.space(22)
            Text {
                anchors.left: parent.left; anchors.verticalCenter: parent.verticalCenter
                text: "Wheel size"; textFormat: Text.PlainText
                color: Commons.Color.menu.text; font.family: Commons.Style.font.menuFamily; font.pixelSize: Commons.Style.space(12)
            }
            Text {
                anchors.right: parent.right; anchors.verticalCenter: parent.verticalCenter
                text: Math.round(Commons.Style.space(panel.diameter)) + " px"; textFormat: Text.PlainText
                color: Commons.Color.accent; font.family: Commons.Style.font.menuFamily; font.pixelSize: Commons.Style.space(12)
            }
        }
        Item {
            width: parent.width; height: Commons.Style.space(30)
            Rectangle {
                anchors.fill: parent; anchors.margins: -4
                radius: Commons.Style.cornerRadius
                color: "transparent"
                border.width: panel.cursor === 0 ? 1 : 0
                border.color: Commons.Color.accent
            }
            PanelSlider {
                anchors.fill: parent
                enabled: !panel.busy
                minimum: 220; maximum: 600; step: 10; integer: true
                value: panel.diameter
                trackColor: Commons.Util.alpha(Commons.Color.menu.text, 0.15)
                fillColor: Commons.Color.accent; knobColor: Commons.Color.accent
                onMoved: value => { panel.diameter = Math.round(value / 10) * 10; panel.cursor = 0; panel.forceActiveFocus(); }
            }
        }
        Rectangle { width: parent.width; height: 1; color: Commons.Util.alpha(Commons.Color.menu.text, 0.12) }
        Item {
            width: parent.width; height: Commons.Style.space(40)
            Text {
                anchors.left: parent.left; anchors.verticalCenter: parent.verticalCenter
                text: "Opening animation"; textFormat: Text.PlainText
                color: Commons.Color.menu.text; font.family: Commons.Style.font.menuFamily; font.pixelSize: Commons.Style.space(12)
            }
            ToggleSwitch {
                anchors.right: parent.right; anchors.verticalCenter: parent.verticalCenter
                checked: panel.animation; busy: panel.busy; hasCursor: panel.cursor === 1
                foreground: Commons.Color.menu.text
                onToggled: { panel.animation = !panel.animation; panel.cursor = 1; panel.forceActiveFocus(); }
            }
        }
        Text {
            width: parent.width
            text: "Open with " + panel.shortcut; textFormat: Text.PlainText
            wrapMode: Text.WordWrap
            color: Commons.Util.alpha(Commons.Color.menu.text, 0.65)
            font.family: Commons.Style.font.menuFamily; font.pixelSize: Commons.Style.space(11)
        }
        Text {
            visible: panel.error !== ""
            width: parent.width; text: panel.error; textFormat: Text.PlainText
            wrapMode: Text.WordWrap
            color: Commons.Color.urgent
            font.family: Commons.Style.font.menuFamily; font.pixelSize: Commons.Style.space(11)
        }
        Row {
            width: parent.width; spacing: Commons.Style.space(8)
            Button {
                width: (parent.width - parent.spacing) / 2
                text: "Cancel"; bordered: true; hasCursor: panel.cursor === 2
                foreground: Commons.Color.menu.text; fontFamily: Commons.Style.font.menuFamily
                onClicked: panel.canceled()
            }
            Button {
                width: (parent.width - parent.spacing) / 2
                text: panel.busy ? "Saving…" : "Save"; bordered: true; selected: true; hasCursor: panel.cursor === 3
                enabled: !panel.busy
                foreground: Commons.Color.menu.text; fontFamily: Commons.Style.font.menuFamily
                onClicked: panel.saveRequested()
            }
        }
    }
}

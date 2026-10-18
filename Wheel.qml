import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import Quickshell.Wayland
import qs.Commons as Commons
import qs.Ui
import "Model.js" as Model

Item {
    id: root
    property string omarchyPath: ""
    property var shell: null
    property var manifest: null
    property bool opened: false
    property bool positioned: false
    property int selected: -1
    property bool keyboardMode: false
    property point pointer: Qt.point(0, 0)
    property var config: ({ actions: [], diameter: 440, animation: true })
    property string configError: ""
    property var pendingCommand: []
    property string lastAction: ""
    readonly property string pluginId: "io.github.tcballard.orb"
    readonly property string configPath: (Quickshell.env("XDG_CONFIG_HOME") || Quickshell.env("HOME") + "/.config") + "/omarchy/orb.json"

    function open(payloadJson) {
        // Payloads deliberately cannot change commands or configuration paths.
        try { JSON.parse(payloadJson || "{}"); } catch (error) {}
        launchDelay.stop(); pendingCommand = [];
        selected = -1; keyboardMode = false; positioned = false;
        moveGate.reset(); opened = true;
        cursor.running = false; cursor.running = true;
        Qt.callLater(function() { keys.forceActiveFocus(); });
    }
    function close() {
        opened = false; positioned = false; selected = -1;
        cursor.running = false; launchDelay.stop(); pendingCommand = [];
    }
    function dismiss() {
        close();
        if (shell && typeof shell.hide === "function") shell.hide(pluginId);
    }
    function select(delta) {
        keyboardMode = true; moveGate.reset();
        selected = selected < 0 ? (delta > 0 ? 0 : 5) : (selected + delta + 6) % 6;
    }
    function activate(index) {
        if (!opened || index < 0 || index >= config.actions.length) return;
        var action = config.actions[index];
        var command = action.command.slice(); lastAction = action.label;
        dismiss();
        // Let the compositor unmap the exclusive layer before a new UI or screenshot.
        pendingCommand = command; launchDelay.start();
    }
    function status() {
        return JSON.stringify({ opened: opened, positioned: positioned, selected: selected,
            keyboard: keyboardMode, x: wheel.x, y: wheel.y, diameter: wheel.width,
            screen: panel.targetScreen ? panel.targetScreen.name : "", error: configError,
            foreground: String(Commons.Color.menu.text), background: String(Commons.Color.menu.background),
            lastAction: lastAction, ready: panel.contentReady, revealed: panel.contentRevealed,
            opacity: wheel.opacity, visible: wheel.visible, windowWidth: panel.width, windowHeight: panel.height,
            scale: panel.devicePixelRatio, monitorScale: panel.targetMonitor ? panel.targetMonitor.scale : 0 });
    }
    FileView {
        id: defaults
        path: Qt.resolvedUrl("config.example.json")
        onLoaded: {
            root.config = Model.parse(text(), root.config).config;
            userConfig.reload();
        }
    }
    FileView {
        id: userConfig
        path: root.configPath
        watchChanges: true
        onFileChanged: reload()
        onLoaded: {
            var parsed = Model.parse(text(), root.config);
            root.config = parsed.config; root.configError = parsed.error;
        }
    }
    Process {
        id: cursor
        command: ["hyprctl", "-j", "cursorpos"]
        stdout: StdioCollector {
            onStreamFinished: {
                if (!root.opened) return;
                try {
                    var p = JSON.parse(text);
                    if (!isFinite(p.x) || !isFinite(p.y)) throw new Error("Invalid pointer");
                    root.pointer = Qt.point(p.x, p.y);
                } catch (error) {
                    var s = panel.targetScreen;
                    root.pointer = Qt.point(s ? s.x + s.width / 2 : 0, s ? s.y + s.height / 2 : 0);
                }
                root.positioned = true;
            }
        }
        onExited: {
            if (root.opened && !root.positioned) {
                var s = panel.targetScreen;
                root.pointer = Qt.point(s ? s.x + s.width / 2 : 0, s ? s.y + s.height / 2 : 0);
                root.positioned = true;
            }
        }
    }
    Timer {
        id: launchDelay
        interval: 120
        onTriggered: {
            var args = [Qt.resolvedUrl("scripts/launch").toString().replace(/^file:\/\//, ""), root.lastAction].concat(root.pendingCommand);
            root.pendingCommand = [];
            Quickshell.execDetached(args);
        }
    }
    IpcHandler {
        target: root.pluginId
        function status(): string { return root.status(); }
    }
    OverlayWindow {
        id: panel
        shown: root.opened
        shownKeyboardFocus: root.opened ? WlrKeyboardFocus.Exclusive : WlrKeyboardFocus.None
        WlrLayershell.namespace: "omarchy-plugin-orb"
        readonly property var monitorData: targetMonitor ? targetMonitor.lastIpcObject : ({})
        readonly property var placement: Model.placement(
            root.pointer.x - (monitorData.x || 0), root.pointer.y - (monitorData.y || 0),
            width, height, monitorData.reserved || [0,0,0,0], Commons.Style.space(root.config.diameter))

        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.AllButtons
            onClicked: root.dismiss()
        }
        Item {
            id: keys
            anchors.fill: parent
            focus: root.opened
            Keys.onPressed: event => {
                if (event.key === Qt.Key_Escape) root.dismiss();
                else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) root.activate(root.selected);
                else if (event.key === Qt.Key_Right || event.key === Qt.Key_Down || (event.key === Qt.Key_Tab && !(event.modifiers & Qt.ShiftModifier))) root.select(1);
                else if (event.key === Qt.Key_Left || event.key === Qt.Key_Up || event.key === Qt.Key_Backtab || event.key === Qt.Key_Tab) root.select(-1);
                else if (event.key >= Qt.Key_1 && event.key <= Qt.Key_6) {
                    root.keyboardMode = true; moveGate.reset(); root.selected = event.key - Qt.Key_1;
                } else return;
                event.accepted = true;
            }
        }
        Item {
            id: wheel
            x: panel.placement.x
            y: panel.placement.y
            width: panel.placement.size
            height: width
            visible: root.positioned
            opacity: root.opened && root.positioned && panel.contentRevealed ? 1 : 0
            scale: opacity > 0 ? 1 : 0.92
            Behavior on opacity { NumberAnimation { duration: root.config.animation ? Commons.Style.duration(150) : 0 } }
            Behavior on scale { NumberAnimation { duration: root.config.animation ? Commons.Style.duration(190) : 0; easing.type: Easing.OutCubic } }

            Rectangle {
                anchors.centerIn: parent
                width: parent.width * 0.98; height: width; radius: width / 2
                color: Commons.Color.menu.background
                border.width: 1
                border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.25)
            }
            Canvas {
                id: ring
                anchors.fill: parent
                antialiasing: true
                property color surface: Commons.Color.menu.background
                property color ink: Commons.Color.menu.text
                property color accent: Commons.Color.accent
                property int selection: root.selected
                onSurfaceChanged: requestPaint()
                onInkChanged: requestPaint()
                onAccentChanged: requestPaint()
                onSelectionChanged: requestPaint()
                onWidthChanged: requestPaint()
                onPaint: {
                    var c = getContext("2d"); c.reset();
                    var center = width / 2, outer = width * 0.48, inner = width * 0.18;
                    c.lineWidth = 1;
                    for (var i = 0; i < 6; i++) {
                        var start = (i * 60 - 120 + 1) * Math.PI / 180;
                        var end = (i * 60 - 60 - 1) * Math.PI / 180;
                        c.beginPath(); c.arc(center,center,outer,start,end);
                        c.arc(center,center,inner,end,start,true); c.closePath();
                        c.fillStyle = surface; c.fill();
                        if (i === selection) { c.fillStyle = Commons.Util.alpha(accent, 0.17); c.fill(); }
                        c.strokeStyle = i === selection ? accent : Commons.Util.alpha(ink, 0.23); c.stroke();
                        if (i === selection) {
                            c.beginPath(); c.arc(center,center,outer-3,start+0.025,end-0.025);
                            c.strokeStyle = accent; c.lineWidth = 3; c.stroke(); c.lineWidth = 1;
                        }
                    }
                }
            }
            Repeater {
                model: root.config.actions
                delegate: Item {
                    required property int index
                    required property var modelData
                    readonly property real angle: (index * 60 - 90) * Math.PI / 180
                    readonly property bool chosen: root.selected === index
                    width: wheel.width * 0.28
                    height: wheel.width * 0.18
                    x: wheel.width/2 + Math.cos(angle) * wheel.width * 0.33 - width/2
                    y: wheel.height/2 + Math.sin(angle) * wheel.width * 0.33 - height/2
                    LineIcon {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: 2; width: wheel.width * 0.066; height: width
                        name: modelData.icon
                        ink: parent.chosen ? Commons.Color.accent : Commons.Color.menu.text
                    }
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: wheel.width * 0.09
                        text: modelData.label; textFormat: Text.PlainText
                        color: parent.chosen ? Commons.Color.accent : Commons.Color.menu.text
                        font.family: Commons.Style.font.menuFamily
                        font.pixelSize: Math.max(11, wheel.width * 0.032)
                        font.weight: parent.chosen ? Font.DemiBold : Font.Normal
                    }
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: wheel.width * 0.14
                        text: String(index + 1); textFormat: Text.PlainText
                        color: Commons.Util.alpha(Commons.Color.menu.text, parent.chosen ? 0.8 : 0.4)
                        font.family: Commons.Style.font.family
                        font.pixelSize: Math.max(9, wheel.width * 0.023)
                    }
                }
            }
            Rectangle {
                anchors.centerIn: parent
                width: parent.width * 0.32; height: width; radius: width / 2
                color: Commons.Color.menu.background
                border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.18)
                Column {
                    anchors.centerIn: parent; spacing: 8
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "ORB"; textFormat: Text.PlainText
                        font.family: Commons.Style.font.family
                        font.pixelSize: wheel.width * 0.038; font.letterSpacing: 3
                        color: Commons.Color.menu.text
                    }
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: root.selected < 0 ? "Choose a direction" : root.keyboardMode ? "Enter to launch" : "Click to launch"
                        textFormat: Text.PlainText
                        font.family: Commons.Style.font.menuFamily; font.pixelSize: wheel.width * 0.023
                        color: Commons.Util.alpha(Commons.Color.menu.text, 0.58)
                    }
                }
            }
            PointerMoveGate { id: moveGate; referenceItem: wheel }
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                acceptedButtons: Qt.AllButtons
                cursorShape: root.selected >= 0 && !root.keyboardMode ? Qt.PointingHandCursor : Qt.ArrowCursor
                onPositionChanged: mouse => {
                    if (!moveGate.moved(this, mouse)) return;
                    root.keyboardMode = false;
                    root.selected = Model.hit(mouse.x, mouse.y, width);
                }
                onExited: if (!root.keyboardMode) root.selected = -1
                onClicked: mouse => {
                    var i = Model.hit(mouse.x, mouse.y, width);
                    if (mouse.button === Qt.LeftButton && i >= 0) root.activate(i);
                    else root.dismiss();
                }
            }
            Rectangle {
                anchors.top: parent.bottom; anchors.topMargin: 8
                anchors.horizontalCenter: parent.horizontalCenter
                width: hint.implicitWidth + 24; height: 28; radius: 14
                color: Commons.Color.menu.background
                border.width: 1; border.color: Commons.Util.alpha(Commons.Color.menu.text, 0.16)
                Text {
                    id: hint; anchors.centerIn: parent
                    text: root.configError ? "Config error · using last valid actions" : "↑ ↓  select    ↵  launch    Esc  close"
                    textFormat: Text.PlainText
                    font.family: Commons.Style.font.menuFamily; font.pixelSize: 11
                    color: root.configError ? Commons.Color.urgent : Commons.Util.alpha(Commons.Color.menu.text, 0.7)
                }
            }
        }
    }
}

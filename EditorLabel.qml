import QtQuick
import qs.Commons as Commons

Text {
    textFormat: Text.PlainText
    color: Commons.Color.menu.text
    font.family: Commons.Style.font.menuFamily
    font.pixelSize: Commons.Style.space(12)
    elide: Text.ElideRight
}

#include <wayland-client.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "pointer.h"
static struct zwlr_virtual_pointer_manager_v1 *manager;
static void global(void *data, struct wl_registry *r, uint32_t name, const char *interface, uint32_t version) {
  if (!strcmp(interface,"zwlr_virtual_pointer_manager_v1")) manager=wl_registry_bind(r,name,&zwlr_virtual_pointer_manager_v1_interface,1);
}
static void removed(void *data,struct wl_registry *r,uint32_t name) {}
int main(int argc,char **argv) {
  if(argc!=6 && argc!=8) { fprintf(stderr,"usage: click x y width height button (0=move) [drag-end-x drag-end-y]\n");return 2; }
  struct wl_display *d=wl_display_connect(NULL); if(!d)return 3;
  struct wl_registry *r=wl_display_get_registry(d);
  const struct wl_registry_listener listener={global,removed};
  wl_registry_add_listener(r,&listener,NULL); wl_display_roundtrip(d);
  if(!manager)return 4;
  struct zwlr_virtual_pointer_v1 *p=zwlr_virtual_pointer_manager_v1_create_virtual_pointer(manager,NULL);
  zwlr_virtual_pointer_v1_motion_absolute(p,0,atoi(argv[1]),atoi(argv[2]),atoi(argv[3]),atoi(argv[4]));
  zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);usleep(100000);
  int button=atoi(argv[5]);
  if(button<0) {
    zwlr_virtual_pointer_v1_axis(p,1,WL_POINTER_AXIS_VERTICAL_SCROLL,wl_fixed_from_int(button==-1?100:-100));
    zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);
  } else if(button) {
    zwlr_virtual_pointer_v1_button(p,1,button,WL_POINTER_BUTTON_STATE_PRESSED);zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);usleep(60000);
    if(argc==8) {
      int x=atoi(argv[1]), y=atoi(argv[2]), endx=atoi(argv[6]), endy=atoi(argv[7]);
      for(int step=1;step<=12;step++) {
        zwlr_virtual_pointer_v1_motion_absolute(p,step,x+(endx-x)*step/12,y+(endy-y)*step/12,atoi(argv[3]),atoi(argv[4]));
        zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);usleep(25000);
      }
    }
    zwlr_virtual_pointer_v1_button(p,2,button,WL_POINTER_BUTTON_STATE_RELEASED);zwlr_virtual_pointer_v1_frame(p);wl_display_roundtrip(d);
  }
  zwlr_virtual_pointer_v1_destroy(p);wl_display_roundtrip(d);wl_display_disconnect(d);return 0;
}

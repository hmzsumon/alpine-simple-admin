#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
/* ────────── imports ────────── */
mod connection;
use std::sync::{atomic::{AtomicU64, Ordering}, Mutex};
use tauri::{menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder}, webview::{NewWindowResponse, WebviewWindowBuilder}, Manager, Theme, WebviewUrl, WebviewWindow, WindowEvent};
use url::Url;
use tauri_plugin_opener::OpenerExt;

#[derive(Default)]
struct Workspace { origin: Mutex<Option<String>>, zoom: Mutex<f64>, serial: AtomicU64 }

fn qa_hidden() -> bool {
    #[cfg(debug_assertions)] {std::env::var("ALPINE_MANAGEMENT_QA").as_deref()==Ok("1")}
    #[cfg(not(debug_assertions))] {false}
}

fn connection_screen(app: &tauri::AppHandle) {
    if qa_hidden(){return;}
    if let Some(main) = app.get_webview_window("main") { let _=main.show(); let _=main.unminimize(); let _=main.set_focus(); }
}

fn workspace_script(origin: &str) -> String {
    format!("(()=>{{if(window.top!==window||location.origin!=={})return;const css={};function mount(){{if(!document.head)return;let s=document.getElementById('alpine-desktop-theme');if(!s){{s=document.createElement('style');s.id='alpine-desktop-theme';s.textContent=css;document.head.append(s);}}}}new MutationObserver(mount).observe(document,{{childList:true,subtree:true}});mount();}})();",serde_json::to_string(origin).unwrap(),serde_json::to_string(include_str!("../../src/theme/workspace.css")).unwrap())
}

/* Remote React/Next pages use their existing cookies and server role guards; no native IPC is granted. */
fn remote_window(app: &tauri::AppHandle, label: &str, url: Url, origin: String, features: Option<tauri::webview::NewWindowFeatures>) -> tauri::Result<WebviewWindow> {
    let navigation_origin=origin.clone();let navigation_app=app.clone();let popup_origin=origin.clone();let popup_app=app.clone();let is_popup=label!="workspace";
    let mut builder=WebviewWindowBuilder::new(app,label,WebviewUrl::External(url))
        .title("Alpine · Owner & Admin").inner_size(1280.0,820.0).min_inner_size(640.0,480.0).center().visible(!qa_hidden())
        .theme(Some(Theme::Light)).disable_drag_drop_handler()
        .data_directory(app.path().app_local_data_dir()?.join("WebView2"))
        .initialization_script(workspace_script(&origin))
        .on_navigation(move |url| {
            let allowed=if is_popup {connection::popup_allowed(url,&navigation_origin)} else {connection::same_workspace(url,&navigation_origin)||(url.scheme()=="blob"&&connection::popup_allowed(url,&navigation_origin))};
            if !allowed && url.scheme()=="https" {let _=navigation_app.opener().open_url(url.as_str(),None::<&str>);}
            allowed
        })
        .on_new_window(move |url,features| {
            if !connection::popup_allowed(&url,&popup_origin) {if url.scheme()=="https"{let _=popup_app.opener().open_url(url.as_str(),None::<&str>);}return NewWindowResponse::Deny;}
            let serial=popup_app.state::<Workspace>().serial.fetch_add(1,Ordering::Relaxed);
            match remote_window(&popup_app,&format!("document-{serial}"),"about:blank".parse().unwrap(),popup_origin.clone(),Some(features)) {
                Ok(window)=>NewWindowResponse::Create{window},Err(_)=>NewWindowResponse::Deny
            }
        });
    if let Some(features)=features {builder=builder.window_features(features);}
    let window=builder.build()?;
    if label=="workspace" {let handle=app.clone();window.on_window_event(move |event| {if matches!(event,WindowEvent::Destroyed) {connection_screen(&handle);}});}
    Ok(window)
}

#[tauri::command]
async fn detect_local_server(window:WebviewWindow)->Result<Option<String>,String>{
    if window.label()!="main" {return Err("Use the connection screen.".into());}
    let client=reqwest::Client::builder().redirect(reqwest::redirect::Policy::none()).timeout(std::time::Duration::from_secs(2)).build().map_err(|_|"Unable to check the server.")?;
    let Ok(response)=client.get("http://localhost:4251/login").send().await else{return Ok(None);};
    if !response.status().is_success(){return Ok(None);}
    let html=response.headers().get(reqwest::header::CONTENT_TYPE).and_then(|v|v.to_str().ok()).map(|v|v.starts_with("text/html")).unwrap_or(false);
    if !html{return Ok(None);}
    let body=response.text().await.unwrap_or_default();
    Ok(if body.to_lowercase().contains("alpine"){Some("http://localhost:4251".into())}else{None})
}

#[tauri::command]
async fn open_workspace(window: WebviewWindow, app: tauri::AppHandle, origin: String) -> Result<(),String> {
    // Keep this guard even with the launcher-only generated command permission.
    if window.label()!="main" {return Err("Open a workspace from the connection screen.".into());}
    let url=connection::validate_origin(&origin)?;let origin=url.origin().ascii_serialization();
    if let Some(existing)=app.get_webview_window("workspace") {
        let current=app.state::<Workspace>().origin.lock().map_err(|_|"Workspace is busy.")?.clone();
        if current.as_deref()==Some(&origin) {let _=existing.show();let _=existing.unminimize();let _=existing.set_focus();return Ok(());}
        return Err("Close the current workspace before changing servers. Finish any unsaved changes first.".into());
    }
    let login=url.join("login").map_err(|_|"Invalid server address.")?;
    let client=reqwest::Client::builder().redirect(reqwest::redirect::Policy::none()).timeout(std::time::Duration::from_secs(10)).build().map_err(|_|"Unable to check the connection.")?;
    let response=client.get(login.clone()).send().await.map_err(|_| if origin==connection::CLOUD {"Cannot reach the cloud workspace. Check this PC's internet connection and try again."} else {"Cannot reach the Admin server. Start Alpine Local Server on this PC. Its current Admin interface is available on the server PC at http://127.0.0.1:4251."}.to_string())?;
    let html=response.headers().get(reqwest::header::CONTENT_TYPE).and_then(|value|value.to_str().ok()).map(|value|value.starts_with("text/html")).unwrap_or(false);
    if !response.status().is_success() || !html {return Err("This address did not return the Admin sign-in page. Check the server and use Admin port 4251.".into());}
    *app.state::<Workspace>().origin.lock().map_err(|_|"Workspace is busy.")?=Some(origin.clone());
    *app.state::<Workspace>().zoom.lock().map_err(|_|"Workspace is busy.")?=1.0;
    let workspace=remote_window(&app,"workspace",login,origin,None).map_err(|_|"The desktop workspace could not open. Check that Microsoft Edge WebView2 is installed.".to_string())?;
    if !qa_hidden(){let _=workspace.maximize();let _=workspace.set_focus();}let _=window.hide();Ok(())
}

fn active_window(app:&tauri::AppHandle) -> Option<WebviewWindow> {
    app.webview_windows().into_values().find(|w|w.label()!="main"&&w.is_focused().unwrap_or(false)).or_else(||app.get_webview_window("workspace"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app,_,_|{if let Some(w)=app.get_webview_window("workspace"){let _=w.show();let _=w.unminimize();let _=w.set_focus();}else{connection_screen(app);}}))
        .manage(Workspace{zoom:Mutex::new(1.0),..Default::default()})
        .invoke_handler(tauri::generate_handler![open_workspace,detect_local_server])
        .setup(|app| {
            if qa_hidden(){if let Some(main)=app.get_webview_window("main"){let _=main.hide();}}
            let connection=MenuItemBuilder::with_id("connection","Connection settings").accelerator("Ctrl+Shift+C").build(app)?;
            let home=MenuItemBuilder::with_id("home","Overview").accelerator("Alt+Home").build(app)?;
            let reload=MenuItemBuilder::with_id("reload","Reload").accelerator("Ctrl+R").build(app)?;
            let print=MenuItemBuilder::with_id("print","Print current page").accelerator("Ctrl+P").build(app)?;
            let back=MenuItemBuilder::with_id("back","Back").accelerator("Alt+Left").build(app)?;
            let workspace_menu=SubmenuBuilder::new(app,"Workspace").items(&[&home,&connection]).separator().item(&print).text("downloads","Open downloads folder").separator().text("close","Close current window").text("quit","Exit application").build()?;
            let edit=SubmenuBuilder::new(app,"Edit").undo().redo().separator().cut().copy().paste().select_all().build()?;
            let view=SubmenuBuilder::new(app,"View").items(&[&back,&reload]).separator().text("zoom-in","Zoom in").text("zoom-out","Zoom out").text("zoom-reset","Actual size").separator().text("fullscreen","Toggle full screen").build()?;
            let help=SubmenuBuilder::new(app,"Help").text("guide","User guide").text("about","About Alpine Owner & Admin").build()?;
            app.set_menu(MenuBuilder::new(app).items(&[&workspace_menu,&edit,&view,&help]).build()?)?;
            app.on_menu_event(|app,event| {
                let id=event.id().as_ref();
                if id=="quit" {app.exit(0);return;}
                if id=="connection"||id=="about" {connection_screen(app);return;}
                if id=="downloads" {if let Ok(base)=app.path().download_dir(){let _=app.opener().open_path(base.to_string_lossy().as_ref(),None::<&str>);}return;}
                if let Some(w)=active_window(app){match id {
                    "home"|"guide"=>{if let Ok(origin)=app.state::<Workspace>().origin.lock(){if let Some(origin)=origin.as_deref(){if let Ok(url)=Url::parse(&format!("{origin}/{}",if id=="home"{"dashboard"}else{"guide"})){let _=w.navigate(url);}}}},
                    "reload"=>{let _=w.reload();},"back"=>{let _=w.eval("history.back()");},"print"=>{let _=w.eval("window.print()");},"close"=>{let _=w.close();},
                    "fullscreen"=>{let _=w.set_fullscreen(!w.is_fullscreen().unwrap_or(false));},
                    "zoom-in"|"zoom-out"|"zoom-reset"=>{if let Ok(mut zoom)=app.state::<Workspace>().zoom.lock(){*zoom=if id=="zoom-reset"{1.0}else{(*zoom+if id=="zoom-in"{0.1}else{-0.1}).clamp(0.7,1.8)};let _=w.set_zoom(*zoom);}},_=>()
                }}
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Unable to start Alpine Owner & Admin");
}

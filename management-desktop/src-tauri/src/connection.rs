/* ────────── accepted management origins; credentials and arbitrary websites are rejected ────────── */
use std::net::Ipv4Addr;
use url::Url;
pub const CLOUD: &str = "https://alpine-simple-admin.vercel.app";

pub fn validate_origin(value: &str) -> Result<Url, String> {
    let mut url = Url::parse(value.trim()).map_err(|_| "Enter a complete Admin address, such as http://localhost:4251.".to_string())?;
    if !url.username().is_empty() || url.password().is_some() || url.path() != "/" || url.query().is_some() || url.fragment().is_some() {
        return Err("Use only the server address and port, without a path, password or query.".into());
    }
    if url.origin().ascii_serialization() == CLOUD { return Ok(url); }
    let local = url.host_str().map(|host| host == "localhost" || host.parse::<Ipv4Addr>().map(|ip| ip.is_private() || ip.is_loopback()).unwrap_or(false)).unwrap_or(false);
    if local && (url.scheme() == "https" || (url.scheme() == "http" && url.port() == Some(4251))) {
        // Next's local middleware canonicalizes redirects to localhost. Start
        // there so cookie scope and the desktop navigation origin stay stable.
        if url.scheme()=="http" && url.host_str()==Some("127.0.0.1") {let _=url.set_host(Some("localhost"));}
        return Ok(url);
    }
    Err("Use the Alpine Cloud workspace or a private Admin server. Local HTTP Admin uses port 4251; port 4250 is the Counter/Waiter API.".into())
}

pub fn same_workspace(url: &Url, origin: &str) -> bool { url.origin().ascii_serialization() == origin }
pub fn popup_allowed(url: &Url, origin: &str) -> bool {
    same_workspace(url, origin) || url.as_str() == "about:blank" || (url.scheme() == "blob" && url.as_str().strip_prefix("blob:").and_then(|value| Url::parse(value).ok()).map(|inner| same_workspace(&inner, origin)).unwrap_or(false))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn accepts_only_explicit_workspace_origins() {
        for value in [CLOUD,"http://127.0.0.1:4251","http://localhost:4251","http://192.168.0.10:4251","http://10.0.0.5:4251","http://172.16.0.5:4251"] { assert!(validate_origin(value).is_ok(),"{value}"); }
        for value in ["http://192.168.0.10:4250","http://8.8.8.8:4251","http://172.32.0.1:4251","https://alpine-simple-admin.vercel.app.evil.example","https://evil.example","https://user:password@alpine-simple-admin.vercel.app","javascript:alert(1)","file:///C:/Windows","https://alpine-simple-admin.vercel.app/path","https://alpine-simple-admin.vercel.app/?secret=x","https://alpine-simple-admin.vercel.app/#x"] { assert!(validate_origin(value).is_err(),"{value}"); }
    }
    #[test] fn reports_and_print_popups_stay_with_the_selected_restaurant() {
        assert_eq!(validate_origin("http://127.0.0.1:4251").unwrap().origin().ascii_serialization(),"http://localhost:4251");
        for path in ["/reports","/bill/123","/login?next=%2Fdashboard"] { assert!(same_workspace(&Url::parse(&format!("{CLOUD}{path}")).unwrap(),CLOUD)); }
        assert!(popup_allowed(&Url::parse("about:blank").unwrap(), CLOUD));
        assert!(popup_allowed(&Url::parse(&format!("blob:{CLOUD}/report")).unwrap(), CLOUD));
        assert!(!popup_allowed(&Url::parse("blob:https://evil.example/report").unwrap(), CLOUD));
        assert!(!popup_allowed(&Url::parse("https://evil.example").unwrap(), CLOUD));
        assert!(!same_workspace(&Url::parse("http://192.168.0.10:4251/reports").unwrap(),CLOUD));
    }
}

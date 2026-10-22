package com.insurepro.document.config;
import feign.RequestInterceptor; import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest; import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
@Component @Slf4j
public class FeignClientInterceptor implements RequestInterceptor {
    @Override public void apply(RequestTemplate template) {
        var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            String auth = req.getHeader("Authorization");
            if (auth != null && !auth.isBlank()) template.header("Authorization", auth);
            String cid = req.getHeader("X-Correlation-ID");
            if (cid != null && !cid.isBlank()) template.header("X-Correlation-ID", cid);
        }
    }
}

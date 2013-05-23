window.csscritic = (function (module, rasterizeHTML) {
    module.renderer = module.renderer || {};

    var getErroneousResourceUrls = function (errors) {
        var erroneousResourceUrls = [];

        errors.forEach(function (error) {
            if (error.url) {
                erroneousResourceUrls.push(error.url);
            }
        });

        return erroneousResourceUrls;
    };

    var doRenderHtml = function (pageUrl, width, height, successCallback, errorCallback) {
        // Execute render jobs one after another to stabilise rendering (especially JS execution).
        // Also provides a more fluid response. Performance seems not to be affected.
        module.util.queue.execute(function (doneSignal) {
            rasterizeHTML.drawURL(pageUrl, {
                    cache: false,
                    width: width,
                    height: height,
                    executeJs: true,
                    executeJsTimeout: 50
                }, function (image, errors) {
                var erroneousResourceUrls = errors === undefined ? [] : getErroneousResourceUrls(errors);

                if (! image) {
                    errorCallback();
                } else {
                    successCallback(image, erroneousResourceUrls);
                }

                doneSignal();
            });
        });
    };

    module.renderer.browserRenderer = function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
        var url = pageUrl;
        if (proxyUrl) {
            url = proxyUrl + "/inline?url=" + pageUrl;
        }
        module.util.ajax(url, function (blob) {
            module.util.getImageForBlob(blob, function (image) {
                if (image) {
                    successCallback(image, []);
                } else {
                    doRenderHtml(url, width, height, function (image, erroneousResourceUrls) {
                        successCallback(image, erroneousResourceUrls);
                    }, function () {
                        if (errorCallback) {
                            errorCallback();
                        }
                    });
                }
            });
        }, function () {
            if (errorCallback) {
                errorCallback();
            }
        });
    };

    module.renderer.getImageForPageUrl = module.renderer.browserRenderer;
    return module;
}(window.csscritic || {}, rasterizeHTML));

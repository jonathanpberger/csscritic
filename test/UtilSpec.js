describe("Utility", function () {
    describe("getImageForUrl", function () {
        it("should load an image", function () {
            var the_image = null,
                imgUrl = csscriticTestPath + "fixtures/green.png";

            csscritic.util.getImageForUrl(imgUrl, function (image) {
                the_image = image;
            });

            waitsFor(function () {
                return the_image !== null;
            });

            runs(function () {
                expect(the_image instanceof HTMLElement).toBeTruthy();
                expect(the_image.nodeName).toEqual("IMG");
                expect(the_image.src.substr(-imgUrl.length)).toEqual(imgUrl);
            });

        });

        it("should handle a missing image", function () {
            var errorCalled = false;

            csscritic.util.getImageForUrl("does_not_exist.png", function () {}, function () {
                errorCalled = true;
            });

            waitsFor(function () {
                return errorCalled;
            });

            runs(function () {
                expect(errorCalled).toBeTruthy();
            });
        });
    });

    describe("getDataURIForImage", function () {
        it("should return the data URI for the given image", function () {
            var imageDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=",
                image = null,
                dataUri;

            csscriticTestHelper.loadImageFromUrl(imageDataUri, function (the_image) {
                image = the_image;
            });

            waitsFor(function () {
                return image !== null;
            });

            runs(function () {
                dataUri = csscritic.util.getDataURIForImage(image);
                expect(dataUri).toContain(imageDataUri.substr(0, 10));
            });
        });
    });

    describe("ajax", function () {

        var loadText = function (blob, callback) {
            var reader = new FileReader();

            reader.onload = function (e) {
                callback(e.target.result);
            };

            reader.readAsText(blob);
        };

        it("should load content from a URL", function () {
            var loadedContent,
                errorCallback = jasmine.createSpy("errorCallback");

            csscritic.util.ajax(jasmine.getFixtures().fixturesPath + "simple.js", function (blob) {
                loadText(blob, function (content) {
                    loadedContent = content;
                });
            }, errorCallback);

            waitsFor(function () {
                return loadedContent !== undefined;
            });

            runs(function () {
                expect(loadedContent).toEqual('var s = "hello";\n');
                expect(errorCallback).not.toHaveBeenCalled();
            });
        });

        it("should call error callback on fail", function () {
            var finished = false,
                successCallback = jasmine.createSpy("successCallback"),
                errorCallback = jasmine.createSpy("errorCallback").andCallFake(function () {
                    finished = true;
                });

            csscritic.util.ajax(jasmine.getFixtures().fixturesPath + "non_existing_url.html", successCallback, errorCallback);

            waitsFor(function () {
                return finished;
            });

            runs(function () {
                expect(successCallback).not.toHaveBeenCalled();
                expect(errorCallback).toHaveBeenCalled();
            });
        });
    });

    describe("getImageForBlob", function () {
        // Compat for old PhantomJS
        var aBlob = function (content, properties) {
            var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder,
                blobBuilder;
            try {
                return new Blob([content], properties);
            } catch (e) {
                blobBuilder = new BlobBuilder();
                blobBuilder.append(content[0]);
                return blobBuilder.getBlob(properties.type);
            }
        };

        it("should return an image for a blob", function () {
            var svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
                blob = aBlob([svg], {"type": "image/svg+xml"}),
                theImage;

            csscritic.util.getImageForBlob(blob, function (image) {
                theImage = image;
            });

            waitsFor(function () {
                return theImage !== undefined;
            });

            runs(function () {
                expect(theImage).not.toBe(null);
                expect(theImage.src).toEqual('data:image/svg+xml;base64,' + btoa(svg));
            });
        });

        it("should return null for something else", function () {
            var blob = aBlob(["some text"], {"type": "text/plain"}),
                result;

            csscritic.util.getImageForBlob(blob, function (image) {
                result = image;
            });

            waitsFor(function () {
                return result !== undefined;
            });

            runs(function () {
                expect(result).toBe(null);
            });
        });
    });

    describe("map", function () {
        it("should map each value to one function call and then call complete function", function () {
            var completedValues = [],
                completed = false;

            csscritic.util.map([1, 2, 3], function (val, callback) {
                completedValues.push(val);

                callback();
            }, function () {
                completed = true;
            });

            expect(completed).toBeTruthy();
            expect(completedValues).toEqual([1, 2, 3]);
        });

        it("should pass computed results as array to complete function", function () {
            var computedResults = null;

            csscritic.util.map([1, 2, 3], function (val, callback) {
                callback(val + 1);
            }, function (results) {
                computedResults = results;
            });

            expect(computedResults).toEqual([2, 3, 4]);
        });

        it("should call complete if empty list is passed", function () {
            var completed = false,
                computedResults = null;

            csscritic.util.map([], function () {}, function (results) {
                completed = true;
                computedResults = results;
            });

            expect(completed).toBeTruthy();
            expect(computedResults).toEqual([]);
        });

        it("should not call complete until last value is handled", function () {
            var completedValues = [],
                completed = false,
                lastCallback = null;

            csscritic.util.map([1, 2, 3], function (val, callback) {
                completedValues.push(val);

                if (val < 3) {
                    callback();
                } else {
                    lastCallback = callback;
                }
            }, function () {
                completed = true;
            });

            expect(completed).toBeFalsy();

            lastCallback();

            expect(completed).toBeTruthy();
        });

    });

    describe("executor queue", function () {
        afterEach(function () {
            csscritic.util.queue.clear();
        });

        it("should execute a single job", function () {
            var job = jasmine.createSpy("job");
            csscritic.util.queue.execute(job);

            expect(job).toHaveBeenCalled();
        });

        it("should execute two jobs sequencially", function () {
            var job1 = jasmine.createSpy("job1"),
                job2 = jasmine.createSpy("job2");
            csscritic.util.queue.execute(job1);
            csscritic.util.queue.execute(job2);

            expect(job1).toHaveBeenCalled();
            expect(job2).not.toHaveBeenCalled();

            job1.mostRecentCall.args[0]();
            expect(job2).toHaveBeenCalled();
        });
    });

});

describe("SignOffReporter", function () {
    var htmlImage = "html image",
        referenceImage = "reference image",
        acceptPageSpy, loadFullDocumentSpy, calculateFingerprintSpy;

    beforeEach(function () {
        acceptPageSpy = jasmine.createSpy("acceptPage");
        loadFullDocumentSpy = spyOn(csscritic.signOffReporterUtil, 'loadFullDocument').andCallFake(function (url, callback) {
            callback("some content");
        });
        calculateFingerprintSpy = spyOn(csscritic.signOffReporterUtil, 'calculateFingerprint').andReturn("fIngRPrinT");
    });

    it("should auto-accept a signed of version on a failing test", function () {
        var fixtureUrl = csscriticTestPath + "fixtures/",
            pageUrl = fixtureUrl + 'pageUnderTest.html';

        var reporter = csscritic.SignOffReporter([{
            pageUrl: pageUrl,
            fingerprint: "fIngRPrinT"
        }]);

        reporter.reportComparison({
            status: "failed",
            pageUrl: pageUrl,
            pageImage: htmlImage,
            resizePageImage: function () {},
            acceptPage: acceptPageSpy,
            referenceImage: referenceImage
        });

        expect(acceptPageSpy).toHaveBeenCalled();

        expect(loadFullDocumentSpy).toHaveBeenCalledWith(pageUrl, jasmine.any(Function));
        expect(calculateFingerprintSpy).toHaveBeenCalledWith("some content");
    });
});
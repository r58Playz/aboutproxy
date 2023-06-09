class History {
    constructor() {
        this.reload();
    }

    push(url, title, icon) {
        this.history.history.push({url: url, title: title, icon: icon});
        this.recalculateDomainViewCounts();
        this.save();
    }

    clear() {
        this.history.history = [];
        this.history.statistics.domainViewCounts = [];
        this.save();
    }

    save() {
        localStorage.setItem("history", JSON.stringify(this.history));
    }

    reload() {
        this.history = JSON.parse(localStorage.getItem("history"));
        if(this.history == null) this.history = {history: [], statistics: {domainViewCounts: {}}}; this.save();
    }

    getList() {
        return this.history.history;
    }

    recalculateDomainViewCounts() {
        var domainViewCounts = {};
        for(const site of this.history.history) {
            var sSite = JSON.stringify(site);
            if(domainViewCounts[sSite]) {
                domainViewCounts[sSite] += 1;
            } else {
                domainViewCounts[sSite] = 1;
            }
        }
        this.history.statistics.domainViewCounts = domainViewCounts;
        this.save();
    }

    getSortedDomainViewCounts() {
        return Object.entries(this.history.statistics.domainViewCounts).sort(([,a],[,b]) => b-a);
    }
}


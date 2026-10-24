(function () {
    function money(cents) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents) || 0) / 100);
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
    }

    function statusLabel(status) {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }

    window.DaydreamFormat = { money: money, formatDate: formatDate, statusLabel: statusLabel };
})();

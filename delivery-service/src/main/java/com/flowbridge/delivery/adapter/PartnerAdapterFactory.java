package com.flowbridge.delivery.adapter;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PartnerAdapterFactory {

    private final Map<String, PartnerAdapter> adapterMap = new HashMap<>();

    public PartnerAdapterFactory(List<PartnerAdapter> adapters) {
        for (PartnerAdapter adapter : adapters) {
            adapterMap.put(adapter.getSupportedAdapterType().toUpperCase(), adapter);
        }
    }

    public PartnerAdapter getAdapter(String adapterType) {
        if (adapterType == null) {
            throw new IllegalArgumentException("adapterType cannot be null");
        }
        PartnerAdapter adapter = adapterMap.get(adapterType.toUpperCase());
        if (adapter == null) {
            throw new IllegalArgumentException("No PartnerAdapter registered for adapter type: " + adapterType);
        }
        return adapter;
    }
}

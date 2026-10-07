export interface OptimizerItem {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  priority: 'Standard' | 'High' | 'Urgent';
  itemId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  totalWeightKg: number;
  totalVolumeM3: number;
}

export interface OptimizerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  priority: 'Standard' | 'High' | 'Urgent';
  totalWeightKg: number;
  totalVolumeM3: number;
  items: OptimizerItem[];
}

export interface AvailableContainer {
  id: string;
  code: string;
  typeId: string;
  typeName: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  costMad: number;
}

export interface AllocationItemResult {
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  weightKg: number;
  volumeM3: number;
  isSplit: boolean;
}

export interface ContainerAllocationResult {
  containerId: string;
  containerCode: string;
  containerTypeName: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  costMad: number;
  allocatedWeightKg: number;
  allocatedVolumeM3: number;
  weightUtilizationPct: number;
  volumeUtilizationPct: number;
  compositeUtilizationPct: number;
  limitingFactor: 'Weight' | 'Volume' | 'Balanced';
  assignedOrders: string[]; // Order numbers
  items: AllocationItemResult[];
  status: 'Planned' | 'Prepared' | 'Dispatched';
  isManuallyModified: boolean;
}

export interface OptimizationWarning {
  type: 'IMPOSSIBLE_ITEM' | 'IMPOSSIBLE_ORDER' | 'FLEET_CAPACITY_EXCEEDED' | 'WARNING';
  orderNumber?: string;
  itemSku?: string;
  message: string;
}

export interface OptimizationResult {
  runId: string;
  runDate: string;
  allowSplitting: boolean;
  totalOrdersCount: number;
  totalItemsCount: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  containersBefore: number;
  costBeforeMad: number;
  containersAfter: number;
  costAfterMad: number;
  containersSaved: number;
  costSavedMad: number;
  savingsPercentage: number;
  allocations: ContainerAllocationResult[];
  warnings: OptimizationWarning[];
  splitOrders: { orderNumber: string; containers: string[] }[];
  summary: {
    avgWeightUtilization: number;
    avgVolumeUtilization: number;
    highestUtilizedContainer: string;
  };
}

export function runOptimization(
  orders: OptimizerOrder[],
  availableContainers: AvailableContainer[],
  options: { allowSplitting: boolean }
): OptimizationResult {
  const warnings: OptimizationWarning[] = [];
  const runId = `run-${Date.now()}`;
  const runDate = new Date().toISOString();

  // 1. Data Validation
  let maxWeightInFleet = 0;
  let maxVolumeInFleet = 0;
  let totalFleetWeightCapacity = 0;
  let totalFleetVolumeCapacity = 0;

  for (const c of availableContainers) {
    if (c.maxWeightKg <= 0 || c.maxVolumeM3 <= 0) {
      warnings.push({
        type: 'WARNING',
        message: `Container ${c.code} has invalid zero or negative capacity and was excluded.`
      });
      continue;
    }
    if (c.maxWeightKg > maxWeightInFleet) maxWeightInFleet = c.maxWeightKg;
    if (c.maxVolumeM3 > maxVolumeInFleet) maxVolumeInFleet = c.maxVolumeM3;
    totalFleetWeightCapacity += c.maxWeightKg;
    totalFleetVolumeCapacity += c.maxVolumeM3;
  }

  // Check each item for single-unit impossibilities
  const validOrders: OptimizerOrder[] = [];
  const invalidOrderIds = new Set<string>();

  for (const order of orders) {
    let orderHasImpossibleItem = false;
    for (const item of order.items) {
      if (item.unitWeightKg < 0 || item.unitVolumeM3 < 0 || item.quantity <= 0) {
        warnings.push({
          type: 'WARNING',
          orderNumber: order.orderNumber,
          itemSku: item.itemSku,
          message: `Item ${item.itemSku} in order ${order.orderNumber} has negative weight/volume or non-positive quantity.`
        });
        orderHasImpossibleItem = true;
      }
      if (item.unitWeightKg > maxWeightInFleet) {
        warnings.push({
          type: 'IMPOSSIBLE_ITEM',
          orderNumber: order.orderNumber,
          itemSku: item.itemSku,
          message: `⚠ ${item.itemSku} cannot fit into any available container because its unit weight (${item.unitWeightKg.toLocaleString()} kg) exceeds the largest container capacity (${maxWeightInFleet.toLocaleString()} kg).`
        });
        orderHasImpossibleItem = true;
      }
      if (item.unitVolumeM3 > maxVolumeInFleet) {
        warnings.push({
          type: 'IMPOSSIBLE_ITEM',
          orderNumber: order.orderNumber,
          itemSku: item.itemSku,
          message: `⚠ ${item.itemSku} cannot fit into any available container because its unit volume (${item.unitVolumeM3} m³) exceeds the largest container capacity (${maxVolumeInFleet} m³).`
        });
        orderHasImpossibleItem = true;
      }
    }

    if (orderHasImpossibleItem) {
      invalidOrderIds.add(order.id);
      continue;
    }

    // If splitting is NOT allowed, check if the whole order fits into at least one container type
    if (!options.allowSplitting) {
      if (order.totalWeightKg > maxWeightInFleet || order.totalVolumeM3 > maxVolumeInFleet) {
        warnings.push({
          type: 'IMPOSSIBLE_ORDER',
          orderNumber: order.orderNumber,
          message: `⚠ Order ${order.orderNumber} cannot fit into any single container (Weight: ${order.totalWeightKg.toLocaleString()} kg, Volume: ${order.totalVolumeM3.toFixed(2)} m³). Enable "Allow order splitting" to distribute its items.`
        });
        invalidOrderIds.add(order.id);
        continue;
      }
    }

    validOrders.push(order);
  }

  // Calculate total demands of valid orders
  const totalWeightKg = Math.round(validOrders.reduce((sum, o) => sum + o.totalWeightKg, 0) * 100) / 100;
  const totalVolumeM3 = Math.round(validOrders.reduce((sum, o) => sum + o.totalVolumeM3, 0) * 1000) / 1000;
  const totalItemsCount = validOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0);

  if (totalWeightKg > totalFleetWeightCapacity || totalVolumeM3 > totalFleetVolumeCapacity) {
    warnings.push({
      type: 'FLEET_CAPACITY_EXCEEDED',
      message: `Total freight demand (${totalWeightKg.toLocaleString()} kg / ${totalVolumeM3.toFixed(1)} m³) approaches or exceeds total available fleet capacity (${totalFleetWeightCapacity.toLocaleString()} kg / ${totalFleetVolumeCapacity.toFixed(1)} m³). Some shipments may require additional vehicles.`
    });
  }

  // 2. Baseline Calculation (Before Optimization)
  const baselineResult = calculateNaiveBaseline(validOrders, availableContainers);

  // 3. Optimized Allocation (Multi-dimensional Best-Fit Decreasing with Knapsack Packing)
  const optimizedAllocations = performVectorBinPacking(validOrders, availableContainers, options.allowSplitting);

  // Post-optimization metrics
  const containersBefore = baselineResult.containersUsed;
  const costBeforeMad = baselineResult.totalCost;

  const containersAfter = optimizedAllocations.length;
  const costAfterMad = Math.round(optimizedAllocations.reduce((sum, a) => sum + a.costMad, 0));

  const containersSaved = Math.max(0, containersBefore - containersAfter);
  const costSavedMad = Math.max(0, costBeforeMad - costAfterMad);
  const savingsPercentage = costBeforeMad > 0 ? Math.round((costSavedMad / costBeforeMad) * 1000) / 10 : 0;

  // Track split orders
  const orderContainersMap = new Map<string, Set<string>>();
  for (const alloc of optimizedAllocations) {
    for (const it of alloc.items) {
      if (!orderContainersMap.has(it.orderNumber)) {
        orderContainersMap.set(it.orderNumber, new Set());
      }
      orderContainersMap.get(it.orderNumber)!.add(alloc.containerCode);
    }
  }

  const splitOrders: { orderNumber: string; containers: string[] }[] = [];
  for (const [orderNumber, containerSet] of orderContainersMap.entries()) {
    if (containerSet.size > 1) {
      splitOrders.push({
        orderNumber,
        containers: Array.from(containerSet),
      });
      // Flag items inside allocations as split
      for (const alloc of optimizedAllocations) {
        for (const it of alloc.items) {
          if (it.orderNumber === orderNumber) {
            it.isSplit = true;
          }
        }
      }
    }
  }

  // Summary stats
  const avgWeightUtilization = optimizedAllocations.length > 0
    ? Math.round((optimizedAllocations.reduce((sum, a) => sum + a.weightUtilizationPct, 0) / optimizedAllocations.length) * 10) / 10
    : 0;
  const avgVolumeUtilization = optimizedAllocations.length > 0
    ? Math.round((optimizedAllocations.reduce((sum, a) => sum + a.volumeUtilizationPct, 0) / optimizedAllocations.length) * 10) / 10
    : 0;

  let highestUtilizedContainer = '';
  let highestComposite = -1;
  for (const a of optimizedAllocations) {
    if (a.compositeUtilizationPct > highestComposite) {
      highestComposite = a.compositeUtilizationPct;
      highestUtilizedContainer = a.containerCode;
    }
  }

  return {
    runId,
    runDate,
    allowSplitting: options.allowSplitting,
    totalOrdersCount: validOrders.length,
    totalItemsCount,
    totalWeightKg,
    totalVolumeM3,
    containersBefore,
    costBeforeMad,
    containersAfter,
    costAfterMad,
    containersSaved,
    costSavedMad,
    savingsPercentage,
    allocations: optimizedAllocations,
    warnings,
    splitOrders,
    summary: {
      avgWeightUtilization,
      avgVolumeUtilization,
      highestUtilizedContainer,
    },
  };
}

function calculateNaiveBaseline(
  orders: OptimizerOrder[],
  containers: AvailableContainer[]
): { containersUsed: number; totalCost: number } {
  if (orders.length === 0) return { containersUsed: 0, totalCost: 0 };

  const defaultContainer = containers[0] || {
    id: 'c-default',
    code: 'DEF-01',
    typeId: 'def',
    typeName: 'Standard Rigid Truck',
    maxWeightKg: 3800,
    maxVolumeM3: 24.0,
    costMad: 750,
  };

  interface NaiveBin {
    weight: number;
    volume: number;
    cost: number;
  }

  const bins: NaiveBin[] = [];

  for (const order of orders) {
    let placed = false;
    for (const bin of bins) {
      if (
        bin.weight + order.totalWeightKg <= defaultContainer.maxWeightKg &&
        bin.volume + order.totalVolumeM3 <= defaultContainer.maxVolumeM3
      ) {
        bin.weight += order.totalWeightKg;
        bin.volume += order.totalVolumeM3;
        placed = true;
        break;
      }
    }

    if (!placed) {
      bins.push({
        weight: order.totalWeightKg,
        volume: order.totalVolumeM3,
        cost: defaultContainer.costMad,
      });
    }
  }

  const containersUsed = bins.length;
  const totalCost = bins.reduce((sum, b) => sum + b.cost, 0);

  return { containersUsed, totalCost };
}

function performVectorBinPacking(
  orders: OptimizerOrder[],
  containers: AvailableContainer[],
  allowSplitting: boolean
): ContainerAllocationResult[] {
  if (orders.length === 0 || containers.length === 0) return [];

  const pool = [...containers].sort((a, b) => {
    const costPerCapacityA = a.costMad / (a.maxWeightKg * 0.5 + a.maxVolumeM3 * 200);
    const costPerCapacityB = b.costMad / (b.maxWeightKg * 0.5 + b.maxVolumeM3 * 200);
    return costPerCapacityA - costPerCapacityB;
  });

  const activeAllocations: {
    container: AvailableContainer;
    allocatedWeight: number;
    allocatedVolume: number;
    items: AllocationItemResult[];
    assignedOrderSet: Set<string>;
  }[] = [];

  if (!allowSplitting) {
    const maxW = Math.max(...pool.map((c) => c.maxWeightKg));
    const maxV = Math.max(...pool.map((c) => c.maxVolumeM3));

    const sortedOrders = [...orders].sort((a, b) => {
      const prioScore = (p: string) => (p === 'Urgent' ? 3 : p === 'High' ? 2 : 1);
      if (prioScore(b.priority) !== prioScore(a.priority)) {
        return prioScore(b.priority) - prioScore(a.priority);
      }
      const scoreA = (a.totalWeightKg / maxW) * 0.5 + (a.totalVolumeM3 / maxV) * 0.5;
      const scoreB = (b.totalWeightKg / maxW) * 0.5 + (b.totalVolumeM3 / maxV) * 0.5;
      return scoreB - scoreA;
    });

    for (const order of sortedOrders) {
      let bestAllocIndex = -1;
      let minResidualWaste = Infinity;

      for (let i = 0; i < activeAllocations.length; i++) {
        const alloc = activeAllocations[i];
        const newWeight = alloc.allocatedWeight + order.totalWeightKg;
        const newVolume = alloc.allocatedVolume + order.totalVolumeM3;

        if (newWeight <= alloc.container.maxWeightKg && newVolume <= alloc.container.maxVolumeM3) {
          const remW = (alloc.container.maxWeightKg - newWeight) / alloc.container.maxWeightKg;
          const remV = (alloc.container.maxVolumeM3 - newVolume) / alloc.container.maxVolumeM3;
          const waste = remW + remV;
          if (waste < minResidualWaste) {
            minResidualWaste = waste;
            bestAllocIndex = i;
          }
        }
      }

      if (bestAllocIndex !== -1) {
        const targetAlloc = activeAllocations[bestAllocIndex];
        targetAlloc.allocatedWeight += order.totalWeightKg;
        targetAlloc.allocatedVolume += order.totalVolumeM3;
        targetAlloc.assignedOrderSet.add(order.orderNumber);

        for (const it of order.items) {
          targetAlloc.items.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            itemId: it.itemId,
            itemName: it.itemName,
            itemSku: it.itemSku,
            quantity: it.quantity,
            weightKg: it.totalWeightKg,
            volumeM3: it.totalVolumeM3,
            isSplit: false,
          });
        }
      } else {
        const candidateContainers = pool.filter(
          (c) =>
            !activeAllocations.some((a) => a.container.id === c.id) &&
            c.maxWeightKg >= order.totalWeightKg &&
            c.maxVolumeM3 >= order.totalVolumeM3
        );

        candidateContainers.sort((a, b) => a.costMad - b.costMad);

        const chosenContainer = candidateContainers[0] || pool.find(
          (c) => !activeAllocations.some((a) => a.container.id === c.id)
        ) || {
          ...pool[0],
          id: `c-extra-${activeAllocations.length + 1}`,
          code: `EXT-${activeAllocations.length + 1}`,
        };

        const newAllocItems: AllocationItemResult[] = order.items.map((it) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          itemId: it.itemId,
          itemName: it.itemName,
          itemSku: it.itemSku,
          quantity: it.quantity,
          weightKg: it.totalWeightKg,
          volumeM3: it.totalVolumeM3,
          isSplit: false,
        }));

        activeAllocations.push({
          container: chosenContainer,
          allocatedWeight: order.totalWeightKg,
          allocatedVolume: order.totalVolumeM3,
          items: newAllocItems,
          assignedOrderSet: new Set([order.orderNumber]),
        });
      }
    }
  } else {
    interface ItemChunk {
      orderId: string;
      orderNumber: string;
      customerName: string;
      priority: 'Standard' | 'High' | 'Urgent';
      itemId: string;
      itemName: string;
      itemSku: string;
      quantity: number;
      unitWeightKg: number;
      unitVolumeM3: number;
      totalWeightKg: number;
      totalVolumeM3: number;
    }

    const itemChunks: ItemChunk[] = [];
    for (const order of orders) {
      for (const it of order.items) {
        itemChunks.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          priority: order.priority,
          itemId: it.itemId,
          itemName: it.itemName,
          itemSku: it.itemSku,
          quantity: it.quantity,
          unitWeightKg: it.unitWeightKg,
          unitVolumeM3: it.unitVolumeM3,
          totalWeightKg: it.totalWeightKg,
          totalVolumeM3: it.totalVolumeM3,
        });
      }
    }

    itemChunks.sort((a, b) => {
      const scoreA = a.totalWeightKg + a.totalVolumeM3 * 200;
      const scoreB = b.totalWeightKg + b.totalVolumeM3 * 200;
      return scoreB - scoreA;
    });

    for (const chunk of itemChunks) {
      let remainingQty = chunk.quantity;

      while (remainingQty > 0) {
        const singleWeight = chunk.unitWeightKg;
        const singleVolume = chunk.unitVolumeM3;

        let bestAllocIndex = -1;
        let maxFitQty = 0;

        for (let i = 0; i < activeAllocations.length; i++) {
          const alloc = activeAllocations[i];
          const remWeight = alloc.container.maxWeightKg - alloc.allocatedWeight;
          const remVol = alloc.container.maxVolumeM3 - alloc.allocatedVolume;

          const fitByW = singleWeight > 0 ? Math.floor(remWeight / singleWeight) : remainingQty;
          const fitByV = singleVolume > 0 ? Math.floor(remVol / singleVolume) : remainingQty;
          const fit = Math.min(fitByW, fitByV, remainingQty);

          if (fit > maxFitQty) {
            maxFitQty = fit;
            bestAllocIndex = i;
          }
        }

        if (bestAllocIndex !== -1 && maxFitQty > 0) {
          const alloc = activeAllocations[bestAllocIndex];
          const packQty = maxFitQty;
          const packWeight = Math.round(packQty * singleWeight * 100) / 100;
          const packVolume = Math.round(packQty * singleVolume * 1000) / 1000;

          alloc.allocatedWeight = Math.round((alloc.allocatedWeight + packWeight) * 100) / 100;
          alloc.allocatedVolume = Math.round((alloc.allocatedVolume + packVolume) * 1000) / 1000;
          alloc.assignedOrderSet.add(chunk.orderNumber);

          alloc.items.push({
            orderId: chunk.orderId,
            orderNumber: chunk.orderNumber,
            customerName: chunk.customerName,
            itemId: chunk.itemId,
            itemName: chunk.itemName,
            itemSku: chunk.itemSku,
            quantity: packQty,
            weightKg: packWeight,
            volumeM3: packVolume,
            isSplit: packQty < chunk.quantity,
          });

          remainingQty -= packQty;
        } else {
          const availableFromPool = pool.filter(
            (c) => !activeAllocations.some((a) => a.container.id === c.id)
          );
          const chosenContainer = availableFromPool[0] || {
            ...pool[0],
            id: `c-extra-${activeAllocations.length + 1}`,
            code: `EXT-${activeAllocations.length + 1}`,
          };

          const remWeight = chosenContainer.maxWeightKg;
          const remVol = chosenContainer.maxVolumeM3;
          const fitByW = singleWeight > 0 ? Math.floor(remWeight / singleWeight) : remainingQty;
          const fitByV = singleVolume > 0 ? Math.floor(remVol / singleVolume) : remainingQty;
          const packQty = Math.max(1, Math.min(fitByW, fitByV, remainingQty));

          const packWeight = Math.round(packQty * singleWeight * 100) / 100;
          const packVolume = Math.round(packQty * singleVolume * 1000) / 1000;

          activeAllocations.push({
            container: chosenContainer,
            allocatedWeight: packWeight,
            allocatedVolume: packVolume,
            items: [
              {
                orderId: chunk.orderId,
                orderNumber: chunk.orderNumber,
                customerName: chunk.customerName,
                itemId: chunk.itemId,
                itemName: chunk.itemName,
                itemSku: chunk.itemSku,
                quantity: packQty,
                weightKg: packWeight,
                volumeM3: packVolume,
                isSplit: packQty < chunk.quantity,
              },
            ],
            assignedOrderSet: new Set([chunk.orderNumber]),
          });

          remainingQty -= packQty;
        }
      }
    }
  }

  const results: ContainerAllocationResult[] = activeAllocations.map((alloc) => {
    const wUtil = Math.min(100, Math.round((alloc.allocatedWeight / alloc.container.maxWeightKg) * 1000) / 10);
    const vUtil = Math.min(100, Math.round((alloc.allocatedVolume / alloc.container.maxVolumeM3) * 1000) / 10);
    const composite = Math.round(Math.max(wUtil, vUtil) * 10) / 10;

    let limitingFactor: 'Weight' | 'Volume' | 'Balanced' = 'Balanced';
    if (wUtil > vUtil + 15) limitingFactor = 'Weight';
    else if (vUtil > wUtil + 15) limitingFactor = 'Volume';

    return {
      containerId: alloc.container.id,
      containerCode: alloc.container.code,
      containerTypeName: alloc.container.typeName,
      maxWeightKg: alloc.container.maxWeightKg,
      maxVolumeM3: alloc.container.maxVolumeM3,
      costMad: alloc.container.costMad,
      allocatedWeightKg: Math.round(alloc.allocatedWeight * 100) / 100,
      allocatedVolumeM3: Math.round(alloc.allocatedVolume * 1000) / 1000,
      weightUtilizationPct: wUtil,
      volumeUtilizationPct: vUtil,
      compositeUtilizationPct: composite,
      limitingFactor,
      assignedOrders: Array.from(alloc.assignedOrderSet),
      items: alloc.items,
      status: 'Planned',
      isManuallyModified: false,
    };
  });

  return results;
}

"use client";

import { useState } from "react";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  deleteAccount,
  insertAccount,
  updateAccount,
} from "@/services/account";

type FeeRule = {
  id: number;
  threshold_amount: number;
  fee_rate: number;
  fixed_fee: number;
  is_daily_sum: boolean;
};

type Broker = {
  id: number;
  name: string;
  fee_templates?: {
    id: number;
    name: string;
    sort_order: number | null;
    fee_rules: FeeRule[];
  }[];
};

type Account = {
  id: number;
  name: string | null;
  is_nisa: boolean;
  broker_id: number | null;
  template_id?: number | null;
  sort_order: number;
  brokers: { name: string } | { name: string }[] | null;
};

type Props = {
  initialAccounts: Account[];
  brokers: Broker[];
  userId: string;
};

const formatFeeRules = (rules: FeeRule[]) => {
  if (!rules || rules.length === 0) return "";
  return rules
    .map((rule) => {
      const threshold =
        rule.threshold_amount > 0
          ? `~${rule.threshold_amount.toLocaleString()}`
          : "以降";
      const fees = [];
      if (rule.fixed_fee > 0) fees.push(`${rule.fixed_fee}円`);
      if (rule.fee_rate > 0) fees.push(`${rule.fee_rate}%`);
      const feeText = fees.length > 0 ? fees.join("+") : "無料";
      return `${threshold}:${feeText}`;
    })
    .join(" / ");
};

export default function AccountListClient({
  initialAccounts,
  brokers,
  userId,
}: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // フォームの状態
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    broker_id: "",
    name: "",
    is_nisa: false,
    template_id: "",
  });

  // モーダルを開く（新規・編集共通）
  const openModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        broker_id: account.broker_id?.toString() || "",
        name: account.name || "",
        is_nisa: account.is_nisa,
        template_id: account.template_id?.toString() || "",
      });
    } else {
      setEditingAccount(null);
      setFormData({
        broker_id: "",
        name: "",
        is_nisa: false,
        template_id: "",
      });
    }
    setIsModalOpen(true);
  };

  // 保存処理（INSERT or UPDATE）
  const handleSave = async () => {
    if (!formData.broker_id) {
      alert("証券会社を選択してください");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        user_id: userId,
        broker_id: parseInt(formData.broker_id),
        name: formData.name,
        is_nisa: formData.is_nisa,
        template_id: formData.template_id
          ? parseInt(formData.template_id)
          : null,
      };

      if (editingAccount) {
        // 更新
        await updateAccount(editingAccount.id, payload);
      } else {
        // 新規作成
        // 既存の最小値を取得して、それより小さい値を設定（一番上に追加）
        const currentOrders = initialAccounts.map((a) => a.sort_order);
        const minOrder =
          currentOrders.length > 0 ? Math.min(...currentOrders) : 0;
        // 余裕を持って -10 する
        await insertAccount({ ...payload, sort_order: minOrder - 10 });
      }

      setIsModalOpen(false);
      router.refresh(); // サーバーコンポーネントを再取得して画面更新
    } catch (e: any) {
      console.error("Error saving account:", e);
      alert("保存に失敗しました: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 削除処理
  const handleDelete = async (id: number) => {
    if (!confirm("本当にこの口座を削除しますか？")) return;

    setIsLoading(true);
    try {
      await deleteAccount(id);
      router.refresh();
    } catch (e: any) {
      console.error("Error deleting account:", e);
      alert("削除に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 並び替え処理
  const handleMove = async (index: number, direction: "up" | "down") => {
    if (isLoading) return;

    const targetAccount = initialAccounts[index];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const swapAccount = initialAccounts[swapIndex];

    if (!targetAccount || !swapAccount) return;

    setIsLoading(true);
    try {
      // sort_orderを入れ替える
      await Promise.all([
        updateAccount(targetAccount.id, { sort_order: swapAccount.sort_order }),
        updateAccount(swapAccount.id, { sort_order: targetAccount.sort_order }),
      ]);
      router.refresh();
    } catch (e: any) {
      console.error("Error moving account:", e);
      alert("並び替えに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 選択中の証券会社データ
  const selectedBroker = brokers.find(
    (b) => b.id.toString() === formData.broker_id
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => openModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          ＋ 新規口座を追加
        </button>
      </div>

      {/* 口座一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">登録済み口座一覧</h2>
        </div>
        <ul className="divide-y divide-slate-200">
          {initialAccounts && initialAccounts.length > 0 ? (
            initialAccounts.map((account, index) => {
              // 紐付いている手数料プラン情報を取得
              const broker = brokers.find((b) => b.id === account.broker_id);
              const template = broker?.fee_templates?.find(
                (t) => t.id === account.template_id
              );

              return (
                <li key={account.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="font-semibold text-slate-800">
                      {account.name || "名称未設定"}
                      {account.is_nisa && (
                        <span className="ml-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          NISA
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-4">
                      {/* 並び替えボタン */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0 || isLoading}
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="上に移動"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={
                            index === initialAccounts.length - 1 || isLoading
                          }
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="下に移動"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01-.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openModal(account)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      {(Array.isArray(account.brokers)
                        ? account.brokers[0]?.name
                        : account.brokers?.name) || "証券会社情報なし"}
                    </p>
                    {template && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium mr-1">
                          {template.name}:
                        </span>
                        {formatFeeRules(template.fee_rules)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li className="p-6 text-center text-slate-500">
              登録されている証券口座はありません。
            </li>
          )}
        </ul>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingAccount ? "口座情報の編集" : "新規口座の追加"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  証券会社
                </label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2"
                  value={formData.broker_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broker_id: e.target.value,
                      template_id: "", // 証券会社が変わったらプランをリセット
                    })
                  }
                >
                  <option value="">選択してください</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  口座表示名
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-md p-2"
                  placeholder="例: メイン口座"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* 手数料プラン選択 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  手数料プラン
                </label>
                {!formData.broker_id ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-500">
                    先に証券会社を選択してください
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {/* 未設定 */}
                    <label
                      className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                        formData.template_id === ""
                          ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="template_id"
                        value=""
                        checked={formData.template_id === ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            template_id: e.target.value,
                          })
                        }
                        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">
                        未設定
                      </span>
                    </label>

                    {selectedBroker?.fee_templates?.map((t) => {
                      const ruleText = formatFeeRules(t.fee_rules);
                      const isSelected =
                        formData.template_id === t.id.toString();
                      return (
                        <label
                          key={t.id}
                          className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="template_id"
                            value={t.id}
                            checked={isSelected}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                template_id: e.target.value,
                              })
                            }
                            className="mt-1 h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          <div className="ml-2">
                            <div className="text-sm font-medium text-slate-900">
                              {t.name}
                            </div>
                            {ruleText && (
                              <div className="text-xs text-slate-500 mt-1">
                                {ruleText}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="is_nisa"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                  checked={formData.is_nisa}
                  onChange={(e) =>
                    setFormData({ ...formData, is_nisa: e.target.checked })
                  }
                />
                <label
                  htmlFor="is_nisa"
                  className="ml-2 text-sm text-slate-700"
                >
                  NISA口座として登録する
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
